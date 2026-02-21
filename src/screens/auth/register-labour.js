import { useNavigation, useRoute } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export default function RegisterLabour() {
  const navigation = useNavigation();
  const route = useRoute();

  // 🔒 We do NOT trust role from params
  const role = "labour";
  const { mobile } = route.params;

  const [hasGST, setHasGST] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gst, setGst] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");

  /* 🔒 MOBILE UNIQUENESS CHECK */
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
        });
      }
    };

    verifyMobileUniqueness();
  }, []);

  /* ✅ GST VERIFY (OPTIONAL) */
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

      // Auto-fill from GST
      setName(data.tradeName || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setPincode(data.pincode || "");
      setState(data.state || "");

      setGstVerified(true);
    } catch (e) {
      console.log("GST VERIFY ERROR:", e);
      Alert.alert("GST verification failed");
    } finally {
      setVerifyingGST(false);
    }
  };

  /* 📍 PINCODE TEMP LOGIC */
  const handlePincodeChange = async (value) => {
  setPincode(value);

  // Reset if less than 6 digits
  if (value.length < 6) {
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
      setCity(data[0].PostOffice[0].District);
      setState(data[0].PostOffice[0].State);
    } else {
      setCity("");
      setState("");
      Alert.alert("Invalid PIN", "PIN code not found");
    }
  } catch (error) {
    console.log("PIN FETCH ERROR:", error);
    setCity("");
    setState("");
  }
};


  /* 🚀 SUBMIT */
  const handleSubmit = async () => {
    if (!name || !password || !confirmPassword || !pincode || !address) {
      Alert.alert("Error", "All mandatory fields are required");
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

    if (hasGST && !gstVerified) {
      Alert.alert("GST Required", "Please verify your GST number first");
      return;
    }

    try {
      const loginEmail = `${mobile}@labour.buildo`;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        loginEmail,
        password
      );

      if (!auth.currentUser) {
  Alert.alert("Error", "Session expired.");
  return;
}

const uid = auth.currentUser.uid;


      // 🔐 SAVE PROFILE
      await saveUserProfile({
        uid,
        role: "labour",
        mobile,
        name,
        hasGST,
        gst: hasGST ? gst : null,
        gstVerified: hasGST ? true : false,
        address,
        city,
        state,
        pincode,
        createdAt: new Date(),
      });

      // 🔐 SAVE MOBILE INDEX
      await setDoc(doc(db, "mobileIndex", mobile), {
        uid,
        role,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Labour Contractor registered successfully");

      

    } catch (error) {
      console.log("LABOUR REGISTER ERROR:", error);
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Labour Contractor Registration</Text>

      {hasGST && (
        <>
          <TextInput
            style={styles.input}
            placeholder="GST Number"
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
            setGst("");
            setGstVerified(false);
          }
        }}
      >
        <Text style={{ textAlign: "center", fontWeight: "bold" }}>
          {hasGST ? "I don't have GST" : "GST Available ✓"}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Contractor Name *"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.readOnly}
        value={mobile}
        editable={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Create Password *"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password *"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="PIN Code *"
        keyboardType="numeric"
        maxLength={6}
        value={pincode}
        onChangeText={handlePincodeChange}
      />

      <TextInput style={styles.input} placeholder="City" value={city} editable={false} />
            <TextInput style={styles.input} placeholder="State" value={state} editable={false} />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Address *"
        multiline
        value={address}
        onChangeText={setAddress}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  readOnly: {
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

