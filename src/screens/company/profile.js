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


export default function CompanyProfile() {
  const user = auth.currentUser;

  const [companyName, setCompanyName] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [email, setEmail] = useState();
  const [gst, setGst] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
<VerificationBadge level={userData.verificationLevel} />

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "companies", user.uid));
        if (!snap.exists()) return;

        const data = snap.data();
        setCompanyName(data.companyName);
        setAuthorizedPerson(data.authorizedPerson || "");
        setEmail(data.email || "");
        setGst(data.gst || "");
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
      await updateDoc(doc(db, "companies", user.uid), {
        companyName,
        authorizedPerson,
        email,
        gst,
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
      <Text style={styles.title}>Company Profile</Text>

      <TextInput style={styles.input} value={companyName} />
      <TextInput style={styles.input} value={authorizedPerson} onChangeText={setAuthorizedPerson} placeholder="Authorized Person" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email" />
      <TextInput style={styles.input} value={gst} onChangeText={setGst} placeholder="GST Number" />
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
