import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";

export function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", u.uid);
      const unsubProfile = onSnapshot(ref, (snap) => {
        setProfile(snap.data());
        setLoading(false);
      });

      return unsubProfile;
    });

    return unsubAuth;
  }, []);

  return { user, profile, loading };
}
