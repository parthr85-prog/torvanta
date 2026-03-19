import firestore from "@react-native-firebase/firestore";

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

  let verificationLevel = "basic";

  if (gstVerified === true) {
    verificationLevel = "gst";
  }

  await firestore()
    .collection("users")
    .doc(uid)
    .set(
      {
        uid,
        role,
        ...profileData,

        status: "active",
        profileCompleted: true,
        verificationLevel: data.verificationLevel || verificationLevel,
        subscription: "free",

        experienceYears: data.experienceYears || 0,
        totalProjectsCompleted: 0,
        ongoingProjects: 0,

        rating: 0,
        totalRatings: 0,

        profileSummary: data.profileSummary || "",

        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
};