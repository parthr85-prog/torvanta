import {
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
} from "firebase/auth";

import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { doc, getDoc } from "firebase/firestore";
import { BackHandler } from "react-native";
import { auth, db, firebaseConfig, setOtpVerified } from "../../../firebaseConfig";


export default function RegisterPhone() {
  const route = useRoute();
  const [timer, setTimer] = useState(30);
const [canResend, setCanResend] = useState(false);
useEffect(() => {
  {
  const backAction = () => true; // block back
  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();
};
}, [step, timer]);

  const { role } = route.params;
  const navigation = useNavigation();

  const recaptchaVerifier = useRef(null);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("PHONE"); // PHONE | OTP
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  const sendOTP = async () => {
    if (mobile.length !== 10) {
      Alert.alert("Invalid number");
      return;
    }

    try {
      setLoading(true);

    const mobileRef = doc(db, "mobileIndex", mobile);
    const snap = await getDoc(mobileRef);

    if (snap.exists()) {
      Alert.alert(
        "Mobile Already Registered",
        "This mobile number is already in use. Please login."
      );
      return; // ⛔ STOP — NO OTP
    }
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${mobile}`,
        recaptchaVerifier.current
      );

      setVerificationId(confirmation.verificationId);
      setStep("OTP");
      setTimer(30);
setCanResend(false);
    } catch (e) {
      Alert.alert("OTP Error", e.message);
    } finally {
      setLoading(false);
    }
  };

const verifyOTP = async () => {
  if (otp.length !== 6) {
    Alert.alert("Invalid OTP");
    return;
  }

  if (!verificationId) {
    Alert.alert("Error", "Verification ID missing");
    return;
  }

  try {
    setLoading(true);

    const credential = PhoneAuthProvider.credential(
      verificationId,
      otp
    );

    // 🔥 This throws error if OTP is wrong
    await signInWithCredential(auth, credential);
setOtpVerified();
    // ✅ ONLY runs on SUCCESS
    // AFTER OTP VERIFIED SUCCESSFULLY
if (role === "company") {
  navigation.replace("RegisterCompany", { mobile });
} else if (role === "contractor") {
  navigation.replace("RegisterContractor", { mobile });
} else if (role === "labour") {
  navigation.replace("RegisterLabour", { mobile });
}


  } catch (e) {
    console.log("VERIFY OTP ERROR:", e);
    Alert.alert("Verification failed", "Incorrect OTP");
    return; // ⛔ STOP EXECUTION
  } finally {
    setLoading(false);
  }
};
return (
  <View style={styles.container}>
<FirebaseRecaptchaVerifierModal
  ref={recaptchaVerifier}
  firebaseConfig={firebaseConfig}
  attemptInvisibleVerification
/>

    <Text style={styles.title}>Mobile Verification</Text>

    {/* PHONE STEP */}
    {step === "PHONE" && (
      <>
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={sendOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>
      </>
    )}

    {/* OTP STEP */}
    {step === "OTP" && (
      <>
        <Text style={styles.label}>
          OTP sent to +91 {mobile}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={verifyOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Text>
        </TouchableOpacity>

        {/* RESEND OTP */}
        {canResend ? (
          <TouchableOpacity onPress={sendOTP}>
            <Text style={{ color: "#2563eb", textAlign: "center", marginTop: 10 }}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ textAlign: "center", marginTop: 10 }}>
            Resend OTP in {timer}s
          </Text>
        )}
      </>
    )}

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { textAlign: "center", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
