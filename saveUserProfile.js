import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const saveUserProfile = async (data) => {
  if (!data?.uid || !data?.role) {
    throw new Error("UID or Role missing while saving profile");
  }

  const {
    uid,
    role,
    gstVerified = false,
    ...profileData
  } = data;

  // 🔹 Decide verification level
  let verificationLevel = "basic";

  if (gstVerified === true) {
    verificationLevel = "gst";
  }

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      role,
      ...profileData,

      // 🔒 System fields
      status: "active",
      profileCompleted: true,
      verificationLevel: data.verificationLevel || "basic", // 🔥 badge system
      subscription: "free",
      // 🔹 Experience & Stats
      experienceYears: data.experienceYears || 0,
      totalProjectsCompleted: 0,
      ongoingProjects: 0,

      // 🔹 Ratings
      rating: 0,
      totalRatings: 0,

      profileSummary: data.profileSummary || "",


      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
