import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Place a bid
export const placeBid = async ({
  listingId,
  bidderId,
  bidderRole,
  bidAmount,
  message
}) => {
  await addDoc(collection(db, "bids"), {
    listingId,
    bidderId,
    bidderRole,
    bidAmount,
    message,
    status: "pending",
    createdAt: serverTimestamp()
  });
};

// Get bids for a listing (owner view)
export const getBidsForListing = async (listingId) => {
  const q = query(
    collection(db, "bids"),
    where("listingId", "==", listingId)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update bid status
export const updateBidStatus = async (bidId, status) => {
  await updateDoc(doc(db, "bids", bidId), { status });
};
