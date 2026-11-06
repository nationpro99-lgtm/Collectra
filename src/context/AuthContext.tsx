import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, BusinessProfile } from '../types';
import { storageService } from '../services/storage';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { gmailService, GMAIL_SCOPES } from '../services/gmail';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AuthUser | null;
  currentBusiness: BusinessProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerBusiness: (data: {
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_USER_KEY = 'collectiq_session_user';
const SESSION_BIZ_KEY = 'collectiq_session_biz';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync business from Firestore or session
  const syncUserBusiness = async (uid: string, fallbackEmail: string, fallbackName: string) => {
    let businessId = `biz_${uid.substring(0, 10)}`;
    let businessProfile: BusinessProfile = {
      businessId,
      businessName: `${fallbackName || 'My'} Business`,
      ownerName: fallbackName || 'Account Owner',
      ownerEmail: fallbackEmail || '',
      phone: '',
      businessAddress: '',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata (IST)',
      createdDate: new Date().toISOString().split('T')[0],
    };

    if (db) {
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as Partial<AuthUser>;
          if (userData.businessId) {
            businessId = userData.businessId;
          }
        }

        const bizRef = doc(db, 'businesses', businessId);
        const bizSnap = await getDoc(bizRef);

        if (bizSnap.exists()) {
          businessProfile = bizSnap.data() as BusinessProfile;
        } else {
          await setDoc(bizRef, {
            ...businessProfile,
            ownerUid: uid,
          });
        }
      } catch (err) {
        console.warn('Firestore business load notice', err);
      }
    }

    return { businessId, businessProfile };
  };

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { businessId, businessProfile } = await syncUserBusiness(
          fbUser.uid,
          fbUser.email || '',
          fbUser.displayName || 'Owner'
        );

        const userObj: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'User',
          businessId,
          role: 'Admin',
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(userObj);
        setCurrentBusiness(businessProfile);
        storageService.setBusiness(businessId, businessProfile.businessName, businessProfile.ownerEmail, businessProfile.ownerName);

        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
        localStorage.setItem(SESSION_BIZ_KEY, JSON.stringify(businessProfile));
      } else {
        // Fallback session check
        try {
          const storedUser = localStorage.getItem(SESSION_USER_KEY);
          const storedBiz = localStorage.getItem(SESSION_BIZ_KEY);
          if (storedUser && storedBiz) {
            const user: AuthUser = JSON.parse(storedUser);
            const biz: BusinessProfile = JSON.parse(storedBiz);
            setCurrentUser(user);
            setCurrentBusiness(biz);
            storageService.setBusiness(biz.businessId, biz.businessName, biz.ownerEmail, biz.ownerName);
          }
        } catch {
          // Ignored
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // Email / Password Login
  const loginWithEmail = async (
    email: string,
    pass: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCredential.user;

      const { businessId, businessProfile } = await syncUserBusiness(
        fbUser.uid,
        fbUser.email || email.trim(),
        fbUser.displayName || 'Owner'
      );

      const userObj: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email || email.trim(),
        displayName: fbUser.displayName || 'User',
        businessId,
        role: 'Admin',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(userObj);
      setCurrentBusiness(businessProfile);
      storageService.setBusiness(businessId, businessProfile.businessName, businessProfile.ownerEmail, businessProfile.ownerName);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      storage.setItem(SESSION_BIZ_KEY, JSON.stringify(businessProfile));

      setIsLoading(false);
      return { success: true };
    } catch (fbErr: any) {
      let msg = fbErr.message || 'Failed to sign in.';
      if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials or create an account.';
      } else if (fbErr.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.';
      }
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  // Google Sign In
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized.');
      }

      const provider = new GoogleAuthProvider();
      // Add Workspace Gmail Scopes
      GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
      provider.setCustomParameters({
        prompt: 'consent',
        access_type: 'offline',
      });

      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      // Cache access token in memory (never in localStorage)
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        gmailService.setAccessToken(credential.accessToken);
      }

      const { businessId, businessProfile } = await syncUserBusiness(
        fbUser.uid,
        fbUser.email || '',
        fbUser.displayName || 'Owner'
      );

      const userObj: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'User',
        businessId,
        role: 'Admin',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
      };

      // Ensure user record in Firestore
      if (db) {
        const path = `users/${fbUser.uid}`;
        await setDoc(
          doc(db, 'users', fbUser.uid),
          {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'User',
            businessId,
            role: 'Admin',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
      }

      setCurrentUser(userObj);
      setCurrentBusiness(businessProfile);
      storageService.setBusiness(businessId, businessProfile.businessName, businessProfile.ownerEmail, businessProfile.ownerName);

      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      localStorage.setItem(SESSION_BIZ_KEY, JSON.stringify(businessProfile));

      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      const msg = e.message || 'Google authentication failed.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  // Register Business & Owner
  const registerBusiness = async (data: {
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized.');
      }

      const cleanEmail = data.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const fbUser = userCredential.user;

      const newBusinessId = `biz_${fbUser.uid.substring(0, 10)}`;

      const newBusiness: BusinessProfile = {
        businessId: newBusinessId,
        businessName: data.businessName.trim(),
        ownerName: data.fullName.trim(),
        ownerEmail: cleanEmail,
        phone: data.phone.trim(),
        businessAddress: 'Corporate Headquarters',
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata (IST)',
        createdDate: new Date().toISOString().split('T')[0],
      };

      const newUser: AuthUser = {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: data.fullName.trim(),
        businessId: newBusinessId,
        role: 'Admin',
        phone: data.phone.trim(),
        createdAt: new Date().toISOString(),
      };

      // Write user and business documents to Firestore
      if (db) {
        const userPath = `users/${fbUser.uid}`;
        await setDoc(doc(db, 'users', fbUser.uid), {
          uid: fbUser.uid,
          email: cleanEmail,
          displayName: data.fullName.trim(),
          businessId: newBusinessId,
          role: 'Admin',
          phone: data.phone.trim(),
          createdAt: new Date().toISOString(),
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, userPath));

        const bizPath = `businesses/${newBusinessId}`;
        await setDoc(doc(db, 'businesses', newBusinessId), {
          ...newBusiness,
          ownerUid: fbUser.uid,
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, bizPath));
      }

      // Initialize storage for the new business with empty state
      storageService.setBusiness(newBusinessId, newBusiness.businessName, cleanEmail, data.fullName);

      setCurrentUser(newUser);
      setCurrentBusiness(newBusiness);

      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(SESSION_BIZ_KEY, JSON.stringify(newBusiness));

      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      let msg = e.message || 'Failed to create business account.';
      if (e.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  // Password Reset
  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    setError(null);
    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized.');
      }
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `A password reset link has been dispatched to ${email.trim()}. Please check your inbox.`,
      };
    } catch (e: any) {
      let msg = e.message || 'Failed to send password reset email.';
      if (e.code === 'auth/user-not-found') {
        msg = 'No registered account found with this email address.';
      }
      return { success: false, error: msg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch {
      // Ignored
    }
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_BIZ_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_BIZ_KEY);
    gmailService.disconnectGmail();
    setCurrentUser(null);
    setCurrentBusiness(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentBusiness,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        error,
        loginWithEmail,
        loginWithGoogle,
        registerBusiness,
        resetPassword,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
