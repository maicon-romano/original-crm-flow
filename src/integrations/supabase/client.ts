
// This file is kept for compatibility but now uses Firebase instead of Supabase
import { auth, db } from "@/lib/firebase";

// Re-export Firebase instances to maintain API compatibility where possible
export const firebase = { auth, db };

// Export a dummy supabase object that logs warnings when used
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    console.warn(`DEPRECATED: Attempted to use Supabase ${String(prop)} but the app has migrated to Firebase.`);
    return () => Promise.reject(new Error("Supabase has been replaced with Firebase in this app."));
  }
});
