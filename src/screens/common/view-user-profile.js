import firestore from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import VerificationBadge from "../../components/VerificationBadge";

export default function ViewUserProfile({ route }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const snap = await firestore()
          .collection("users")
          .doc(userId)
          .get();

        if (snap.exists) {
          setProfile(snap.data());
        }
      } catch (e) {
        console.log("PROFILE LOAD ERROR:", e);
      }
    };

    loadProfile();
  }, []);

  if (!profile) return null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.headerCard}>
        <Text style={styles.name}>
          {profile.name || "User"}
        </Text>

        <VerificationBadge
          level={profile.verificationLevel || "basic"}
        />

        <Text style={styles.role}>
          {profile.role || ""}
        </Text>

        <Text style={styles.location}>
          {profile.city || ""}
        </Text>
      </View>

      {/* EXPERIENCE */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Experience</Text>

        <Text style={styles.text}>
          {profile.experienceYears || 0} years experience
        </Text>

        <Text style={styles.text}>
          {profile.totalProjectsCompleted || 0} projects completed
        </Text>

        <Text style={styles.text}>
          {profile.ongoingProjects || 0} ongoing projects
        </Text>
      </View>

      {/* RATING */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rating</Text>

        <Text style={styles.text}>
          ⭐ {profile.rating ? profile.rating.toFixed(1) : "0.0"} (
          {profile.totalRatings || 0} reviews)
        </Text>
      </View>

      {/* ABOUT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>

        <Text style={styles.text}>
          {profile.profileSummary || "No summary added yet."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0B1F3B",
    padding: 20,
    paddingBottom: 40,
  },

  headerCard: {
    backgroundColor: "#122A4D",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E3A63",
    marginBottom: 20,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  role: {
    color: "#D4AF37",
    fontWeight: "600",
    marginTop: 6,
  },

  location: {
    color: "#94A3B8",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#122A4D",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E3A63",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D4AF37",
    marginBottom: 10,
  },

  text: {
    color: "#E5E7EB",
    marginBottom: 6,
  },
});