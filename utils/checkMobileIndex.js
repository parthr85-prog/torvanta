import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Returns:
 *  - null → mobile not registered
 *  - { role, uid } → already registered
 */
export async function checkMobileIndex(mobile) {
  const ref = doc(db, "mobileIndex", mobile);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data(); // { role, uid, createdAt }
}
