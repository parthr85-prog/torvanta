import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function EditProfile() {
  const user = auth.currentUser;

  const [experienceYears, setExperienceYears] = useState("");
  const [profileSummary, setProfileSummary] = useState("");

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        experienceYears: Number(experienceYears),
        profileSummary,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Years of Experience"
        keyboardType="numeric"
        value={experienceYears}
        onChangeText={setExperienceYears}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Profile Summary"
        multiline
        value={profileSummary}
        onChangeText={setProfileSummary}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
