import firestore from "@react-native-firebase/firestore";

/**
 * Returns:
 *  - null → mobile not registered
 *  - { role, uid } → already registered
 */
export async function checkMobileIndex(mobile) {
  const snap = await firestore()
    .collection("mobileIndex")
    .doc(mobile)
    .get();

  if (!snap.exists) return null;

  return snap.data(); // { role, uid, createdAt }
}