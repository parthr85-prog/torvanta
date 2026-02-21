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


export default function RegisterContractor() {
  const navigation = useNavigation();
  const route = useRoute();
  const user = auth.currentUser;
  const { mobile } = route.params;
  const role = "contractor";
  const [hasGST, setHasGST] = useState(false);
const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gst, setGst] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
  const verifyMobileUniqueness = async () => {
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

  verifyMobileUniqueness();
}, []);

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
    setName(data.tradeName);          // Trade Name → Company Name
         // Legal Name → Authorized Person
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


  const handlePincodeChange = async (value) => {
  setPincode(value);

  if (value.length !== 6) {
    setCity("");
    setState("");
    return;
  }

  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${value}`
    );

    const data = await res.json();

    if (data[0]?.Status === "Success") {
      const postOffice = data[0].PostOffice[0];

      setCity(postOffice.District);
      setState(postOffice.State);
    } else {
      setCity("");
      setState("");
      Alert.alert("Invalid PIN", "PIN code not found");
    }
  } catch (error) {
    setCity("");
    setState("");
    Alert.alert("Error", "Failed to fetch location from PIN");
  }
};




  const handleSubmit = async () => {
    // 🔹 Mandatory fields
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !pincode ||
      !address
    ) {
      Alert.alert("Error", "All mandatory fields are required");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Invalid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    

    const normalizedGst = gst.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z]{1}[0-9A-Z]{1}$/;

    if (normalizedGst && !gstRegex.test(normalizedGst)) {
      Alert.alert("Error", "Invalid GST format (00AAAAA0000A0AA)");
      return;
    }
// 🔐 GST enforcement ONLY if user has GST
if (hasGST && !gstVerified) {
  Alert.alert(
    "GST Required",
    "Please verify your GST number before continuing"
  );
  return;
}

    if (pincode.length !== 6) {
      Alert.alert("Error", "PIN code must be 6 digits");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not authenticated via OTP");
      return;
    }

    try {
      // 🔐 Link email/password to OTP user
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);

      if (!auth.currentUser) {
  Alert.alert("Error", "Session expired.");
  return;
}

const uid = auth.currentUser.uid;

      // 💾 Save profile
      await saveUserProfile({
  uid,
  role: "contractor",
  mobile,
name,
  email,
hasGST,
  gst: hasGST ? gst : null,
  gstVerified: hasGST ? true : false,
 address,
  city,
  state,
  pincode,
createdAt: new Date(),
});

await setDoc(doc(db, "mobileIndex", mobile), {
  uid,
  role,
  createdAt: serverTimestamp(),
});

      Alert.alert("Success", "Contractor registered successfully");
     /* if (!data.role) {
  throw new Error("Role is missing while saving user profile");
}*/


      


    } catch (error) {
      console.log("CONTRACTOR REGISTER ERROR:", error);
      Alert.alert("Registration Failed", error.message);
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contractor Registration</Text>
      {hasGST && (
  <>
    <TextInput
      style={styles.input}
      placeholder="GST Number "
      value={gst}
      onChangeText={(t) => setGst(t.toUpperCase())}
      editable={!gstVerified}
    />

    <TouchableOpacity
      onPress={verifyGST}
      disabled={gstVerified || verifyingGST}
      style={{
        backgroundColor: gstVerified ? "#83dba3" : "#54a2e6",
        padding: 10,
        borderRadius: 6,
        marginBottom: 15,
      }}
    >
      <Text style={{ color: "#fff", textAlign: "center" }}>
        {gstVerified ? "GST Verified" : "Verify GST"}
      </Text>
    </TouchableOpacity>
  </>
)}
 
  <TouchableOpacity
  style={{
    padding: 10,
    backgroundColor: hasGST ? "#e8edef" : "#59bd6b",
    borderRadius: 8,
    marginBottom: 15,
  }}
  onPress={() => {
    setHasGST(!hasGST);
    if (!hasGST) {
      // turning OFF GST
      setGst("");
      setGstVerified(false);
    }
  }}
>
  <Text style={{ textAlign: "center", fontWeight: "bold" }}>
    {hasGST ? "I don't have GST" : "GST Available ✓"}
  </Text>
</TouchableOpacity>
  


      <TextInput style={styles.input} placeholder="Name *" editable={!gstVerified} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password *" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password *" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <TextInput style={styles.input} placeholder="PIN Code *" keyboardType="number-pad" maxLength={6} value={pincode} onChangeText={handlePincodeChange} />
      <TextInput style={styles.input} placeholder="City" value={city} editable={false} />
      <TextInput style={styles.input} placeholder="State" value={state} editable={false} />
      <TextInput style={[styles.input, styles.address]} placeholder="Address *" multiline editable={!gstVerified} value={address} onChangeText={setAddress} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  address: { height: 80 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
