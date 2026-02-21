import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";
import VerificationBadge from "../../components/VerificationBadge";
 
export default function ViewUserProfile({ route }) {
 const { userId } = route.params;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };

    loadProfile();
  }, []);

  if (!profile) return null;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        {profile.name}
      </Text>

      <VerificationBadge level={profile.verificationLevel} />
      <View style={{ marginTop: 20 }}>
  <Text style={styles.section}>Experience</Text>
  <Text>
    {profile.experienceYears} years experience
  </Text>
  <Text>
    {profile.totalProjectsCompleted} projects completed
  </Text>
  <Text>
    {profile.ongoingProjects} ongoing projects
  </Text>
</View>

<View style={{ marginTop: 20 }}>
  <Text style={styles.section}>Rating</Text>
  <Text>
    ⭐ {profile.rating?.toFixed(1)} ({profile.totalRatings} reviews)
  </Text>
</View>

<View style={{ marginTop: 20 }}>
  <Text style={styles.section}>About</Text>
  <Text>
    {profile.profileSummary || "No summary added yet."}
  </Text>
</View>


      <Text>{profile.role}</Text>
      <Text>{profile.city}</Text>
    </View>
  );
  
}
const styles = StyleSheet.create({
section: {
  fontWeight: "bold",
  fontSize: 16,
  marginBottom: 6,
}
});

