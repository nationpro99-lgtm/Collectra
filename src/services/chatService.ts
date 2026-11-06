import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { ChatConversation, ChatMessage } from '../types';

class ChatService {
  /**
   * Listen to all conversations for the authenticated user in real-time
   */
  public subscribeConversations(
    userId: string,
    onUpdate: (conversations: ChatConversation[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    if (!db || !userId) {
      onUpdate([]);
      return () => {};
    }

    const path = `users/${userId}/conversations`;
    try {
      const q = query(collection(db, 'users', userId, 'conversations'));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: ChatConversation[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ChatConversation);
          });
          // Sort by updatedAt descending
          list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          onUpdate(list);
        },
        (err) => {
          console.warn('Firestore onSnapshot conversations notice:', err.message);
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.warn('Failed to subscribe to conversations:', err);
      return () => {};
    }
  }

  /**
   * Fetch all conversations once for a user
   */
  public async getConversations(userId: string): Promise<ChatConversation[]> {
    if (!db || !userId) return [];
    const path = `users/${userId}/conversations`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'conversations'));
      const list: ChatConversation[] = [];
      snap.forEach((d) => list.push(d.data() as ChatConversation));
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  /**
   * Fetch all messages in a conversation
   */
  public async getMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
    if (!db || !userId || !conversationId) return [];
    const path = `users/${userId}/conversations/${conversationId}/messages`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'conversations', conversationId, 'messages'));
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => msgs.push(d.data() as ChatMessage));
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return msgs;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  public async createConversation(
    userId: string,
    businessId: string,
    initialTitle = 'New Conversation'
  ): Promise<ChatConversation> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const conversation: ChatConversation = {
      id,
      userId,
      businessId,
      title: initialTitle.slice(0, 200),
      lastMessage: '',
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      const path = `users/${userId}/conversations/${id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'conversations', id), conversation);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    return conversation;
  }

  /**
   * Append a message to a conversation and update conversation metadata
   */
  public async addMessage(params: {
    userId: string;
    businessId: string;
    conversationId: string;
    role: 'ai' | 'user';
    text: string;
    time?: string;
  }): Promise<ChatMessage> {
    const { userId, businessId, conversationId, role, text, time } = params;
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const message: ChatMessage = {
      id: msgId,
      conversationId,
      userId,
      businessId,
      role,
      text: text.slice(0, 5000),
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
    };

    if (db) {
      const msgPath = `users/${userId}/conversations/${conversationId}/messages/${msgId}`;
      try {
        await setDoc(doc(db, 'users', userId, 'conversations', conversationId, 'messages', msgId), message);

        // Update conversation summary
        const convRef = doc(db, 'users', userId, 'conversations', conversationId);
        const snippet = text.length > 90 ? text.substring(0, 87) + '...' : text;
        await updateDoc(convRef, {
          lastMessage: snippet,
          updatedAt: now,
        }).catch(() => {
          // In case parent was just created or need merge
          setDoc(
            convRef,
            {
              id: conversationId,
              userId,
              businessId,
              title: role === 'user' ? text.slice(0, 45) : 'Collection Advisor Session',
              lastMessage: snippet,
              updatedAt: now,
              createdAt: now,
              messageCount: 1,
            },
            { merge: true }
          );
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, msgPath);
      }
    }

    return message;
  }

  /**
   * Permanently delete an individual conversation and all its associated subcollection messages.
   * Enforces that current authenticated user is the owner.
   */
  public async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const currentUid = auth?.currentUser?.uid;
    if (!currentUid || currentUid !== userId) {
      throw new Error('Unauthorized: You can only delete your own chat conversations.');
    }

    if (!db) return;

    const messagesColPath = `users/${userId}/conversations/${conversationId}/messages`;
    const convDocPath = `users/${userId}/conversations/${conversationId}`;

    try {
      // 1. Fetch and delete all messages in the subcollection
      const messagesSnap = await getDocs(
        collection(db, 'users', userId, 'conversations', conversationId, 'messages')
      );

      if (!messagesSnap.empty) {
        // Use batch to delete subcollection messages efficiently
        const batch = writeBatch(db);
        messagesSnap.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        await batch.commit();
      }

      // 2. Delete the parent conversation document
      await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId));
      console.log(`Successfully deleted conversation ${conversationId} and its messages for user ${userId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, convDocPath);
    }
  }

  /**
   * Permanently delete ALL chat history for the currently logged-in user.
   * Deletes only the logged-in user's conversations and subcollections, never touching
   * other users' data or business collections.
   */
  public async deleteAllConversations(userId: string): Promise<{ deletedCount: number }> {
    const currentUid = auth?.currentUser?.uid;
    if (!currentUid || currentUid !== userId) {
      throw new Error('Unauthorized: You can only clear your own chat history.');
    }

    if (!db) return { deletedCount: 0 };

    const convColPath = `users/${userId}/conversations`;

    try {
      const convSnap = await getDocs(collection(db, 'users', userId, 'conversations'));
      let count = 0;

      for (const convDoc of convSnap.docs) {
        const convId = convDoc.id;

        // Delete all messages in the conversation's subcollection
        const msgSnap = await getDocs(
          collection(db, 'users', userId, 'conversations', convId, 'messages')
        );

        if (!msgSnap.empty) {
          const batch = writeBatch(db);
          msgSnap.forEach((m) => batch.delete(m.ref));
          await batch.commit();
        }

        // Delete parent conversation
        await deleteDoc(convDoc.ref);
        count++;
      }

      console.log(`Successfully cleared all (${count}) conversations for user ${userId}`);
      return { deletedCount: count };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, convColPath);
      return { deletedCount: 0 };
    }
  }
}

export const chatService = new ChatService();
