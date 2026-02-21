import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createListing = async (data) => {
  await addDoc(collection(db, "listings"), {
    title: data.title,
    description: data.description,
    timeLimitDays: data.timeLimitDays,
    valueINR: data.valueINR,
    type: data.type,
    documents: data.documents || [],
    createdByRole: data.createdByRole,
    createdByUserId: data.createdByUserId,
    createdAt: serverTimestamp()
  });
};

export const getAllListings = async () => {
  const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getListingById = async (id) => {
  const ref = doc(db, "listings", id);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};
