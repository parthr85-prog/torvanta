import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function EditProfile() {
  const user = auth().currentUser;

  const [experienceYears, setExperienceYears] = useState("");
  const [profileSummary, setProfileSummary] = useState("");

  const handleSave = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          experienceYears: Number(experienceYears),
          profileSummary,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter total years"
        placeholderTextColor="#94A3B8"
        keyboardType="numeric"
        value={experienceYears}
        onChangeText={setExperienceYears}
      />

      <Text style={styles.label}>Profile Summary</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell others about your expertise..."
        placeholderTextColor="#94A3B8"
        multiline
        value={profileSummary}
        onChangeText={setProfileSummary}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0B1F3B",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 25,
  },
  label: {
    color: "#D4AF37",
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#122A4D",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1E3A63",
    color: "#FFFFFF",
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  buttonText: {
    color: "#0B1F3B",
    fontWeight: "700",
    textAlign: "center",
  },
});