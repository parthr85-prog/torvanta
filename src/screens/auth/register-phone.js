import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { setOtpVerified } from "../../../firebaseConfig";
import { setRegistering } from "../../../registrationState";
import { clearConfirmation, getConfirmation, setConfirmation } from "../../utils/otpSession";

export default function RegisterPhone() {
  const route = useRoute();
  const navigation = useNavigation();
  const { role } = route.params;

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("PHONE");
  const [loading, setLoading] = useState(false);
 
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const cleanedMobile = mobile.replace(/\D/g, "").trim();
 

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    let interval;
    if (step === "OTP" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const sendOTP = async () => {
    

    if (cleanedMobile.length !== 10) {
      Alert.alert("Invalid number", "Enter valid 10-digit number");
      return;
    }

    const phoneNumber = `+91${cleanedMobile}`;

    try {
      setLoading(true);

      const snap = await firestore()
        .collection("mobileIndex")
        .doc(cleanedMobile)
        .get();

      if (snap.exists && snap.data()?.uid) {
  setLoading(false); // ✅ ADD
  Alert.alert(
    "Mobile Already Registered",
    "This mobile number is already in use."
  );
  return;
}

     const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
setConfirmation(confirmation);

      
      setMobile(cleanedMobile);
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
    if (loading) return;

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP");
      return;
    }

    try {
      setLoading(true);
      setRegistering(true);

      const confirmation = getConfirmation();

if (!confirmation) {
  setLoading(false);
  setRegistering(false);
  Alert.alert("Session expired", "Please request OTP again.");
  return;
}

await confirmation.confirm(otp);
clearConfirmation();

      setOtpVerified();
      console.log("OTP VERIFY START");
      Alert.alert("Success", "OTP verified successfully");
      setRegistering(true);
setTimeout(() => {
      if (role === "company") navigation.navigate("RegisterCompany", { mobile: cleanedMobile, fromOTP: true }); 
      else if (role === "contractor") navigation.navigate("RegisterContractor", { mobile: cleanedMobile, fromOTP: true }); 
      else if (role === "labour") navigation.navigate("RegisterLabour", { mobile: cleanedMobile, fromOTP: true });
}, 300);

    } catch (e) {
      setRegistering(false);
      console.log("OTP ERROR:", e);
      Alert.alert("Verification failed", "Incorrect OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.brand}>TORVANTA</Text>
      <Text style={styles.subtitle}>Mobile Verification</Text>

      <View style={styles.card}>
        {step === "PHONE" && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#8FA3BF"
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
                {loading ? "Sending..." : "SEND OTP"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === "OTP" && (
          <>
            <Text style={styles.label}>
              OTP sent to +91 {mobile}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#8FA3BF"
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
                {loading ? "Verifying..." : "VERIFY OTP"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1F3B", justifyContent: "center", paddingHorizontal: 24 },
  logo: { width: 90, height: 90, alignSelf: "center", marginBottom: 12 },
  brand: { fontSize: 26, fontWeight: "700", textAlign: "center", color: "#FFFFFF" },
  subtitle: { textAlign: "center", color: "#C7D2E2", marginBottom: 35 },
  card: { backgroundColor: "#122A4D", padding: 24, borderRadius: 18 },
  label: { textAlign: "center", color: "#C7D2E2", marginBottom: 15 },
  input: { backgroundColor: "#0E2445", borderRadius: 14, padding: 15, marginBottom: 18, color: "#FFFFFF" },
  button: { backgroundColor: "#D4AF37", paddingVertical: 16, borderRadius: 14 },
  buttonText: { color: "#0B1F3B", fontWeight: "700", textAlign: "center" },
});