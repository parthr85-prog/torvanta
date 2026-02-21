import { useNavigation, useRoute } from "@react-navigation/native";
import {
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { saveUserProfile } from "../../../saveUserProfile";
import { checkMobileIndex } from "../../../utils/checkMobileIndex";

export default function RegisterCompany() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mobile } = route.params;
  const user = auth.currentUser;
const role = "company";
  const [companyName, setCompanyName] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gst, setGst] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");

  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  /* 🔒 MOBILE UNIQUENESS CHECK */
  useEffect(() => {
    const checkMobile = async () => {
      if (!mobile) return;

      const existing = await checkMobileIndex(mobile);
      if (existing) {
        Alert.alert(
          "Already Registered",
          `This mobile number is already registered as ${existing.role}`
        );
        navigation.reset({
          index: 0,
          routes: [{ name: "login" }],
        })
      }
    };
    checkMobile();
  }, []);

  /* ✅ GST VERIFICATION */
 const verifyGST = async () => {
  if (gst.length !== 15) {
    Alert.alert("Invalid GST", "Enter 15-digit GST number");
    return;
  }

  try {
    setVerifyingGST(true);

    const res = await fetch(
      "https://asia-south1-buildo-940cd.cloudfunctions.net/verifyGST",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstNo: gst }),
      }
    );

    const data = await res.json();

    if (!data.valid) {
      Alert.alert("GST Invalid", "GST number not found");
      return;
    }

    // ✅ AUTO-FILL FROM GST
    setCompanyName(data.tradeName);          // Trade Name → Company Name
    setAuthorizedPerson(data.legalName);     // Legal Name → Authorized Person
    setAddress(data.address);
    setCity(data.city);
    setPincode(data.pincode);
    setState(data.state);

    setGstVerified(true);

  } catch (e) {
    console.log("GST VERIFY ERROR:", e);
    Alert.alert("GST verification failed");
  } finally {
    setVerifyingGST(false);
  }
};

  /* 📍 PINCODE LOOKUP */
  /*const handlePincodeChange = async (value) => {
    setPincode(value);
    if (value.length !== 6) return;

    const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
    const data = await res.json();

    if (data[0]?.Status === "Success") {
      setCity(data[0].PostOffice[0].District);
      setState(data[0].PostOffice[0].State);
    }
  };*/

  /* 🚀 SUBMIT */
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Session expired", "Verify mobile again");
      return;
    }

    if (!gstVerified) {
      Alert.alert("Verify GST", "GST verification required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);

if (!auth.currentUser) {
  Alert.alert("Error", "Session expired.");
  return;
}

const uid = auth.currentUser.uid;

      await saveUserProfile({
        uid,
        role: "company",
        mobile,
        companyName,
        authorizedPerson,
        email,
        gst,
        pincode,
        city,
        state,
        address,
        gstVerified: true,
        createdAt: new Date(),
      });

      await setDoc(doc(db, "mobileIndex", mobile), {
        uid,
        role,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Company registered");
      

    } catch (e) {
      console.log("REGISTER ERROR:", e);
      Alert.alert("Registration failed", e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Company Registration</Text>
 <TextInput style={styles.input} placeholder="GST Number" value={gst} onChangeText={(t) => setGst(t.toUpperCase())} editable={!gstVerified} />
      <TouchableOpacity
  onPress={verifyGST}
  disabled={gstVerified || verifyingGST}
  style={{
        backgroundColor: gstVerified ? "#61ca66" : "#54a2e6",
        padding: 10,
        borderRadius: 6,
        marginBottom: 15,
      }}
>
  <Text style={{ color: "#fff", textAlign: "center" }}>
  
    {verifyingGST
      ? "Verifying..."
      : gstVerified
      ? "GST Verified ✅"
      : "Verify GST"}
  </Text>
</TouchableOpacity>

      <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} editable={!gstVerified} />
      <TextInput style={styles.input} placeholder="Authorized Person" value={authorizedPerson} onChangeText={setAuthorizedPerson} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

     

      <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} editable={!gstVerified} />
      <TextInput style={styles.input} placeholder="City" value={city} editable={!gstVerified} />
      <TextInput style={styles.input} placeholder="State" value={state} editable={!gstVerified} />
      <TextInput style={[styles.input, styles.address]} placeholder="Address" value={address} onChangeText={setAddress} multiline editable={!gstVerified} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12 },
  address: { height: 80 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
