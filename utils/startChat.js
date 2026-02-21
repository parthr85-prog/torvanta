import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Creates or finds existing chat between two users for a listing
 */
export const startChat = async (listingId, userA, userB) => {
  const chatsRef = collection(db, "chats");

  // Check if chat already exists
  const q = query(
    chatsRef,
    where("listingId", "==", listingId),
    where("participants", "array-contains", userA)
  );

  const snapshot = await getDocs(q);

  let existingChat = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(userB)) {
      existingChat = { id: doc.id };
    }
  });

  // If chat exists, return it
  if (existingChat) {
    return existingChat.id;
  }

  // Else create new chat
  const newChat = await addDoc(chatsRef, {
    listingId,
    participants: [userA, userB],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
  });

  return newChat.id;
};
