import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ForgotPassword() {
  const navigation = useNavigation();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [step, setStep] = useState(1);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [otpVerified, setOtpVerified] = useState(false);

  const sendOTP = async () => {
    if (mobile.length !== 10) {
      Alert.alert("Enter valid mobile number");
      return;
    }

    try {
      const confirmation = await auth().signInWithPhoneNumber("+91" + mobile);
      setConfirm(confirmation);
      setStep(2);
    } catch (error) {
      Alert.alert("OTP Error", error.message);
    }
  };

 const verifyOTP = async () => {
  try {
    await confirm.confirm(otp);
setOtpVerified(true);
setStep(3);

  } catch (error) {
    Alert.alert("Invalid OTP");
  }
};

  



const updatePassword = async () => {

  if (newPassword !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  try {

    const user = auth().currentUser;

    if (!user) {
      Alert.alert("Session expired. Please try again.");
      return;
    }

    // update password while OTP session is active
    await user.updatePassword(newPassword);

    // logout after password change
    await auth().signOut();

    Alert.alert("Success", "Password updated successfully");

    navigation.navigate("Login");

  } catch (error) {
    Alert.alert("Error", error.message);
  }
};
  return (
    <View style={styles.container}>

      {step === 1 && (
        <>
          <Text style={styles.title}>Enter Mobile Number</Text>

          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="numeric"
            value={mobile}
            onChangeText={setMobile}
          />

          <TouchableOpacity style={styles.button} onPress={sendOTP}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Enter OTP</Text>

          <TextInput
            style={styles.input}
            placeholder="OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity style={styles.button} onPress={verifyOTP}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
  <>
    <Text style={styles.title}>Set New Password</Text>

    {/* New Password */}
    <View style={{ position: "relative" }}>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#8FA3BF"
        secureTextEntry={!showNewPassword}
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setShowNewPassword(!showNewPassword)}
      >
        <Text style={styles.eyeText}>
          {showNewPassword ? "Hide" : "Show"}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Confirm Password */}
    <View style={{ position: "relative" }}>
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#8FA3BF"
        secureTextEntry={!showConfirmPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
      >
        <Text style={styles.eyeText}>
          {showConfirmPassword ? "Hide" : "Show"}
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity style={styles.button} onPress={updatePassword}>
      <Text style={styles.buttonText}>Update Password</Text>
    </TouchableOpacity>
  </>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1F3B",
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20
  },
  input: {
    backgroundColor: "#0E2445",
    padding: 15,
    borderRadius: 12,
    color: "#fff",
    marginBottom: 15
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#0B1F3B"
  },
  eyeButton: {
  position: "absolute",
  right: 16,
  top: 18,
},

eyeText: {
  color: "#D4AF37",
  fontWeight: "600",
  fontSize: 13,
}
});