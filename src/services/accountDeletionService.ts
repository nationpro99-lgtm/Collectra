import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { chatService } from './chatService';
import { storageService } from './storage';
import { gmailService } from './gmail';
import { AuthUser, BusinessProfile, TeamMember } from '../types';

export interface DeletionImpactSummary {
  isOwner: boolean;
  businessName: string;
  invoicesCount: number;
  customersCount: number;
  paymentsCount: number;
  teamCount: number;
  hasOtherTeamMembers: boolean;
  complianceWarning: string;
}

class AccountDeletionService {
  /**
   * Determine whether the user signed in using Google or Password
   */
  public getAuthMethod(): 'google' | 'password' {
    const user = auth?.currentUser;
    if (!user) return 'password';
    const isGoogle = user.providerData?.some((p) => p.providerId === 'google.com');
    return isGoogle ? 'google' : 'password';
  }

  /**
   * Analyze the deletion impact based on business ownership and associated records
   */
  public async getDeletionImpact(
    currentUser: AuthUser,
    currentBusiness: BusinessProfile | null
  ): Promise<DeletionImpactSummary> {
    const isOwner = Boolean(
      currentBusiness &&
        (currentBusiness.ownerUid === currentUser.uid ||
          currentBusiness.ownerEmail?.toLowerCase() === currentUser.email?.toLowerCase())
    );

    const state = storageService.getState();
    const invoicesCount = state.invoices?.length || 0;
    const customersCount = state.customers?.length || 0;
    const paymentsCount = state.payments?.length || 0;
    const otherMembers = (state.teamMembers || []).filter(
      (m: TeamMember) => m.email?.toLowerCase() !== currentUser.email?.toLowerCase()
    );
    const teamCount = state.teamMembers?.length || 1;
    const hasOtherTeamMembers = otherMembers.length > 0;

    return {
      isOwner,
      businessName: currentBusiness?.businessName || 'Business Workspace',
      invoicesCount,
      customersCount,
      paymentsCount,
      teamCount,
      hasOtherTeamMembers,
      complianceWarning:
        'Legal & Tax Notice: Under Section 36 of GST and statutory accounting standards, financial ledgers, invoices, and vouchers must be maintained for 6 years. Ensure you have exported all financial records (via Export CSV / Print) before proceeding with permanent deletion.',
    };
  }

  /**
   * Re-authenticate the active Firebase User with either Google OAuth or Password
   */
  public async reauthenticate(password?: string): Promise<void> {
    const user = auth?.currentUser;
    if (!user) {
      throw new Error('No active user session found. Please sign in again.');
    }

    const authMethod = this.getAuthMethod();

    if (authMethod === 'google') {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await reauthenticateWithPopup(user, provider);
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user') {
          throw new Error('Google re-authentication was cancelled. You must authenticate to delete your account.');
        }
        if (err.code === 'auth/unauthorized-domain') {
          throw new Error('Google sign-in unauthorized domain. Verify authorized domains in Firebase Console.');
        }
        throw new Error(err.message || 'Google re-authentication failed.');
      }
    } else {
      if (!password || password.trim().length === 0) {
        throw new Error('Please enter your current account password to authorize deletion.');
      }
      try {
        const credential = EmailAuthProvider.credential(user.email || '', password);
        await reauthenticateWithCredential(user, credential);
      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          throw new Error('The password you entered is incorrect. Please re-enter your password.');
        }
        if (err.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again after a few minutes.');
        }
        throw new Error(err.message || 'Password authentication failed.');
      }
    }
  }

  /**
   * Safely batch delete all documents in a Firestore subcollection
   */
  private async deleteSubcollection(collectionPath: string): Promise<number> {
    if (!db) return 0;
    try {
      const snap = await getDocs(collection(db, collectionPath));
      if (snap.empty) return 0;

      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      return snap.size;
    } catch (err) {
      console.warn(`Notice while deleting subcollection ${collectionPath}:`, err);
      return 0;
    }
  }

  /**
   * Perform permanent account deletion across Firebase Auth, Firestore, and backend caches
   */
  public async executeAccountDeletion(params: {
    currentUser: AuthUser;
    currentBusiness: BusinessProfile | null;
    password?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { currentUser, currentBusiness, password } = params;
    const user = auth?.currentUser;

    if (!user || user.uid !== currentUser.uid) {
      throw new Error('Active session mismatch. Please sign in again.');
    }

    // 1. Mandatory Re-authentication
    await this.reauthenticate(password);

    const businessId = currentUser.businessId || currentBusiness?.businessId;
    const isOwner = Boolean(
      currentBusiness &&
        (currentBusiness.ownerUid === currentUser.uid ||
          currentBusiness.ownerEmail?.toLowerCase() === currentUser.email?.toLowerCase())
    );

    console.log(`[Account Deletion] Commencing deletion for ${currentUser.email} (UID: ${currentUser.uid}, Biz: ${businessId}, isOwner: ${isOwner})`);

    // 2. Firestore Data Cleanup
    if (db && businessId) {
      if (isOwner) {
        // Business Owner: Purge all workspace subcollections
        const subcollections = [
          `businesses/${businessId}/invoices`,
          `businesses/${businessId}/customers`,
          `businesses/${businessId}/payments`,
          `businesses/${businessId}/followUps`,
          `businesses/${businessId}/promisesToPay`,
          `businesses/${businessId}/tasks`,
          `businesses/${businessId}/activities`,
          `businesses/${businessId}/activityLogs`,
          `businesses/${businessId}/team`,
          `businesses/${businessId}/paymentLinks`,
        ];

        for (const subPath of subcollections) {
          await this.deleteSubcollection(subPath);
        }

        // Delete parent business document
        const bizDocPath = `businesses/${businessId}`;
        try {
          await deleteDoc(doc(db, 'businesses', businessId));
        } catch (err) {
          console.warn(`Notice deleting business doc ${bizDocPath}:`, err);
        }
      } else {
        // Non-owner team member: Only remove their team member record from the business
        try {
          await deleteDoc(doc(db, 'businesses', businessId, 'team', currentUser.uid));
        } catch (err) {
          console.warn(`Notice removing member from team:`, err);
        }
      }

      // Delete user's private AI advisor conversations & messages
      try {
        await chatService.deleteAllConversations(currentUser.uid);
      } catch (err) {
        console.warn(`Notice deleting chat conversations:`, err);
      }

      // Delete user profile document
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
      } catch (err) {
        console.warn(`Notice deleting user doc:`, err);
      }
    }

    // 3. Backend resource cleanup via API
    try {
      await fetch('/api/account/delete-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          businessId,
          isOwner,
        }),
      });
    } catch (err) {
      console.warn('Backend cleanup call notice:', err);
    }

    // 4. Delete Firebase Authentication User
    try {
      await deleteUser(user);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('Your session timed out. Please re-authenticate and confirm account deletion again.');
      }
      throw new Error(`Failed to delete Firebase authentication record: ${err.message}`);
    }

    // 5. Client Session, Cache, and State Purge
    storageService.resetToDefault();
    gmailService.disconnectGmail();
    localStorage.removeItem('collectiq_session_user');
    localStorage.removeItem('collectiq_session_biz');
    sessionStorage.clear();

    return {
      success: true,
      message: 'Your account and associated data have been permanently deleted.',
    };
  }
}

export const accountDeletionService = new AccountDeletionService();
