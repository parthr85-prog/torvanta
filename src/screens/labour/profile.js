import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import VerificationBadge from "../../components/VerificationBadge";


export default function LabourContractorProfile() {
  const user = auth.currentUser;

  const [labourContractorName, setlabourContractorName] = useState("");
  const [gst, setGst] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
<VerificationBadge level={userData.verificationLevel} />

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "labourContractors", user.uid));
        if (!snap.exists()) return;

        const data = snap.data();
        setlabourContractorName(data.labourContractorName || "");
        setGst(data.gst || "");
        setAadhar(data.aadhar || "");
        setAddress(data.address || "");
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "labourContractors", user.uid), {
        contractorName,
        gst,
        aadhar,
        address,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Profile updated");
    } catch (e) {
      Alert.alert("Update failed", e.message);
    }
  };

  if (loading) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Labour Contractor Profile</Text>

      <TextInput style={styles.input} value={labourContractorName} onChangeText={setlabourContractorName} placeholder="Contractor Name" />
      <TextInput style={styles.input} value={gst} onChangeText={setGst} placeholder="GST Number" />
       <TextInput style={styles.input} value={aadhar} onChangeText={setAadhar} placeholder="Aadhar number" />
      <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Address" multiline />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: { height: 80 },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});