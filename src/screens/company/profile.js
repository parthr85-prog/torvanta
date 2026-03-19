import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import VerificationBadge from "../../components/VerificationBadge";

export default function CompanyProfile() {
  const [companyName, setCompanyName] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [email, setEmail] = useState("");
  const [gst, setGst] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [mobile, setMobile] = useState("");
  const [verificationLevel, setVerificationLevel] = useState("basic");
  const [loading, setLoading] = useState(true);

  const [isVerified, setIsVerified] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newMobile, setNewMobile] = useState("");
  const [mobileVerificationId, setMobileVerificationId] = useState(null);
  const [mobileOtp, setMobileOtp] = useState("");

  const [verifyingGST, setVerifyingGST] = useState(false);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        setMobile(user.phoneNumber || "");

        const snap = await firestore()
          .collection("users")
          .doc(user.uid)
          .get();

        if (!snap.exists) return;

        const data = snap.data();

        setCompanyName(data.companyName || "");
        setAuthorizedPerson(data.authorizedPerson || "");
        setEmail(data.email || "");
        setGst(data.gst || "");
        setCity(data.city || "");
        setState(data.state || "");
        setAddress(data.address || "");
        setVerificationLevel(data.verificationLevel || "basic");
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  /* -------- PROFILE OTP -------- */
  const sendOtp = async () => {
    try {
      const result = await auth().signInWithPhoneNumber(mobile);
      setConfirmation(result);
      Alert.alert("OTP Sent");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const confirmOtp = async () => {
    try {
      await confirmation.confirm(otp);
      setIsVerified(true);
      Alert.alert("Verified. You can now re-verify GST.");
    } catch {
      Alert.alert("Invalid OTP");
    }
  };

  /* -------- GST RE-VERIFICATION -------- */
  const handleReverifyGST = async () => {
    if (!isVerified) {
      Alert.alert("Verify OTP first");
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
        Alert.alert("GST Invalid", "Unable to fetch latest GST details");
        setVerifyingGST(false);
        return;
      }

      const updatedCompanyName = data.tradeName || "";
      const updatedAddress = data.address || "";
      const updatedCity = data.city || "";
      const updatedState = data.state || "";

      const user = auth().currentUser;

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          companyName: updatedCompanyName,
          address: updatedAddress,
          city: updatedCity,
          state: updatedState,
          updatedAt: new Date(),
        });

      setCompanyName(updatedCompanyName);
      setAddress(updatedAddress);
      setCity(updatedCity);
      setState(updatedState);

      Alert.alert("GST Re-Verified & Profile Updated");

      setIsVerified(false);
      setOtp("");
    } catch (e) {
      Alert.alert("Re-verification failed");
    } finally {
      setVerifyingGST(false);
    }
  };

  /* -------- UPDATE PROFILE (Authorized + Email only) -------- */
  const handleUpdateProfile = async () => {
    if (!isVerified) {
      Alert.alert("Verify OTP first");
      return;
    }

    try {
      const user = auth().currentUser;

      await user.updateEmail(email);

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          authorizedPerson,
          email,
          updatedAt: new Date(),
        });

      Alert.alert("Profile Updated");
      setIsVerified(false);
      setOtp("");
    } catch (e) {
      Alert.alert("Update failed", e.message);
    }
  };

  /* -------- CHANGE PASSWORD -------- */
  const handleChangePassword = async () => {
    if (!isVerified) {
      Alert.alert("Verify OTP first");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }

    try {
      await auth().currentUser.updatePassword(newPassword);
      Alert.alert("Password Updated");
      setNewPassword("");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return null;

  /* -------------- NEW MOBILE OTP ------------*/

  const sendMobileOtp = async () => {
  const cleaned = newMobile.replace(/\D/g, "").trim();

  if (cleaned.length !== 10) {
    return Alert.alert("Enter valid 10-digit mobile");
  }

  try {
    // Check uniqueness first
    const existing = await firestore()
      .collection("mobileIndex")
      .doc(cleaned)
      .get();

    if (existing.exists) {
      return Alert.alert("Mobile already registered");
    }

    const confirmation = await auth().signInWithPhoneNumber(
      `+91${cleaned}`
    );

    setMobileVerificationId(confirmation.verificationId);
    Alert.alert("OTP sent to new mobile");

  } catch (e) {
    Alert.alert("Error", e.message);
  }
};

    /* ----------- Change MOBILE -------------*/

  const confirmMobileChange = async () => {
  if (!mobileVerificationId || mobileOtp.length !== 6) {
    return Alert.alert("Enter valid OTP");
  }

  try {
    const cleaned = newMobile.replace(/\D/g, "").trim();
    const user = auth().currentUser;

    const credential = auth.PhoneAuthProvider.credential(
      mobileVerificationId,
      mobileOtp
    );

    // Update phone in Firebase
    await user.updatePhoneNumber(credential);

    // Remove old mobileIndex
    await firestore()
      .collection("mobileIndex")
      .doc(mobile.replace("+91", ""))
      .delete();

    // Add new mobileIndex
    await firestore()
      .collection("mobileIndex")
      .doc(cleaned)
      .set({
        uid: user.uid,
        role: "company",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update Firestore user doc
    await firestore()
      .collection("users")
      .doc(user.uid)
      .update({
        mobile: cleaned,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    setMobile(`+91${cleaned}`);
    setNewMobile("");
    setMobileOtp("");
    setMobileVerificationId(null);

    Alert.alert("Mobile updated successfully");

  } catch (e) {
    Alert.alert("Update failed", e.message);
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1F3B" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Company Profile</Text>

        <VerificationBadge level={verificationLevel} />

        <TextInput style={styles.input} value={mobile} editable={false} />

        {!isVerified && (
          <>
            <TouchableOpacity style={styles.button} onPress={sendOtp}>
              <Text style={styles.buttonText}>Verify OTP to Edit</Text>
            </TouchableOpacity>

            {confirmation && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity style={styles.button} onPress={confirmOtp}>
                  <Text style={styles.buttonText}>Confirm OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Locked Identity Fields */}
        <TextInput style={styles.input} value={companyName} editable={false} />
        <TextInput style={styles.input} value={gst} editable={false} />
        <TextInput style={styles.input} value={city} editable={false} />
        <TextInput style={styles.input} value={state} editable={false} />
        <TextInput style={[styles.input, styles.textArea]} value={address} editable={false} multiline />

        {/* Re-Verify GST Button */}
        {isVerified && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleReverifyGST}
            disabled={verifyingGST}
          >
            <Text style={styles.buttonText}>
              {verifyingGST ? "Verifying..." : "Re-Verify GST & Refresh Details"}
            </Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          value={authorizedPerson}
          onChangeText={setAuthorizedPerson}
          editable={isVerified}
        />

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          editable={isVerified}
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>

        {/* Change Password */}
        <Text style={styles.section}>Change Password</Text>

        <View style={{ position: "relative" }}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>

        {/*change mobile*/}
        <Text style={styles.section}>Change Mobile</Text>

<TextInput
  style={styles.input}
  placeholder="New Mobile"
  placeholderTextColor="#9CA3AF"
  keyboardType="numeric"
  maxLength={10}
  value={newMobile}
  onChangeText={setNewMobile}
/>

<TouchableOpacity style={styles.button} onPress={sendMobileOtp}>
  <Text style={styles.buttonText}>Send OTP</Text>
</TouchableOpacity>

{mobileVerificationId && (
  <>
    <TextInput
      style={styles.input}
      placeholder="Enter OTP"
      placeholderTextColor="#9CA3AF"
      keyboardType="numeric"
      maxLength={6}
      value={mobileOtp}
      onChangeText={setMobileOtp}
    />

    <TouchableOpacity
      style={styles.button}
      onPress={confirmMobileChange}
    >
      <Text style={styles.buttonText}>Confirm Mobile Change</Text>
    </TouchableOpacity>
  </>
)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 20 },
  section: { color: "#D4AF37", fontWeight: "700", marginTop: 25, marginBottom: 10 },
  input: {
    backgroundColor: "#122A4D",
    borderWidth: 1,
    borderColor: "#1E3A63",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    color: "#FFFFFF",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  buttonText: { color: "#0B1F3B", fontWeight: "700", textAlign: "center" },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 18,
  },
  eyeText: {
    color: "#D4AF37",
    fontWeight: "600",
    fontSize: 13,
  },
});