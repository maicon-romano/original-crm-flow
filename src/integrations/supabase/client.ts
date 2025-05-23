
// This file is kept for compatibility but now uses Firebase instead of Supabase
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updatePassword as firebaseUpdatePassword
} from "firebase/auth";

// Re-export Firebase instances to maintain API compatibility where possible
export const firebase = { auth, db };

// Create a compatibility layer for components still using Supabase client
export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { 
          data: { 
            user: userCredential.user,
            session: { user: userCredential.user }
          }, 
          error: null 
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error };
      }
    },
    signOut: async (options?: { scope?: string }) => {
      try {
        await signOut(auth);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    getSession: async () => {
      return { 
        data: { 
          session: auth.currentUser ? { user: auth.currentUser } : null 
        } 
      };
    },
    resetPasswordForEmail: async (email: string, options?: any) => {
      try {
        await sendPasswordResetEmail(auth, email, options);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    updateUser: async ({ password }: { password: string }) => {
      try {
        if (auth.currentUser) {
          await firebaseUpdatePassword(auth.currentUser, password);
          return { error: null };
        }
        throw new Error("No authenticated user");
      } catch (error) {
        return { error };
      }
    },
    onAuthStateChange: (callback: Function) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        const event = user ? 'SIGNED_IN' : 'SIGNED_OUT';
        callback(event, user ? { user } : null);
      });
      
      return { data: { subscription: { unsubscribe } } };
    },
    // Add verifyOtp method for UpdatePassword.tsx
    verifyOtp: async ({ token_hash, type }: { token_hash: string, type: string }) => {
      try {
        // This is a simplified mock - in real Firebase code, you would use
        // auth.verifyPasswordResetCode(code) and auth.confirmPasswordReset(code, newPassword)
        console.log("Verifying OTP:", { token_hash, type });
        return { data: { user: auth.currentUser }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  },
  from: (tableName: string) => ({
    select: (columns: string = "*") => {
      return {
        eq: async (field: string, value: any) => {
          try {
            if (field === 'id') {
              const docRef = doc(db, tableName, value);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                return { data: { ...docSnap.data(), id: docSnap.id }, error: null };
              }
              return { data: null, error: null };
            } else {
              // This is a simplified version, Firestore queries would be more complex
              const querySnapshot = await getDocs(collection(db, tableName));
              const items = querySnapshot.docs
                .filter(doc => doc.data()[field] === value)
                .map(doc => ({ ...doc.data(), id: doc.id }));
              return { data: items, error: null };
            }
          } catch (error) {
            return { data: null, error };
          }
        },
        single: async () => {
          try {
            const querySnapshot = await getDocs(collection(db, tableName));
            if (querySnapshot.empty) {
              return { data: null, error: null };
            }
            const doc = querySnapshot.docs[0];
            return { data: { ...doc.data(), id: doc.id }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        // Mock implementations for other methods used in Dashboard.tsx
        order: () => {
          return {
            limit: async () => {
              try {
                const querySnapshot = await getDocs(collection(db, tableName));
                const items = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                return { data: items, error: null, count: items.length };
              } catch (error) {
                return { data: null, error };
              }
            }
          };
        },
        neq: async (field: string, value: any) => {
          try {
            const querySnapshot = await getDocs(collection(db, tableName));
            const items = querySnapshot.docs
              .filter(doc => doc.data()[field] !== value)
              .map(doc => ({ ...doc.data(), id: doc.id }));
            return { data: items, error: null, count: items.length };
          } catch (error) {
            return { data: null, error };
          }
        },
        not: (operator: string, value: any) => {
          return {
            limit: async () => {
              try {
                const querySnapshot = await getDocs(collection(db, tableName));
                const items = querySnapshot.docs
                  .filter(doc => {
                    if (operator === 'eq') {
                      return doc.data().status !== value;
                    } else if (operator === 'in') {
                      return !value.includes(doc.data().status);
                    }
                    return true;
                  })
                  .map(doc => ({ ...doc.data(), id: doc.id }));
                return { data: items, error: null, count: items.length };
              } catch (error) {
                return { data: null, error };
              }
            }
          };
        }
      };
    },
    insert: async (data: any) => {
      try {
        const id = data.id || crypto.randomUUID();
        await setDoc(doc(db, tableName, id), { ...data, id });
        return { data: { ...data, id }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    update: async (data: any) => {
      try {
        if (!data.id) throw new Error("ID is required for update");
        await updateDoc(doc(db, tableName, data.id), data);
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    delete: async () => {
      return { error: new Error("Not implemented") };
    }
  }),
  functions: {
    invoke: async (functionName: string, { body }: { body: any }) => {
      console.warn(`DEPRECATED: Attempt to call Supabase function ${functionName}, using Firebase implementation`);
      
      // This is a compatibility layer for edge functions
      // You can implement specific handling for each function here
      
      switch (functionName) {
        case "send-invitation":
        case "update-user":
        case "delete-user":
          // For now, just log and return mock response
          console.log(`Function ${functionName} called with:`, body);
          return { data: { success: true }, error: null };
        case "list-drive-folders":
          // Mock response for drive folders
          return { 
            data: { 
              folders: [
                { id: "folder1", name: "Client Docs", mimeType: "application/vnd.google-apps.folder", webViewLink: "https://drive.google.com" },
                { id: "folder2", name: "Contracts", mimeType: "application/vnd.google-apps.folder", webViewLink: "https://drive.google.com" }
              ],
              count: 2 
            }, 
            error: null 
          };
        default:
          return { 
            data: null, 
            error: new Error(`Function ${functionName} not implemented in Firebase compatibility layer`) 
          };
      }
    }
  }
};
