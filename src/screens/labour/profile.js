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

export default function LabourProfile() {
  const [name, setName] = useState("");
  const [gst, setGst] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [verificationLevel, setVerificationLevel] = useState("basic");

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);
  const [newMobile, setNewMobile] = useState("");
const [mobileVerificationId, setMobileVerificationId] = useState(null);
const [mobileOtp, setMobileOtp] = useState("");

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (!user) return;
      setMobile(user.phoneNumber || "");
      setEmail(user.email || "");

      const snap = await firestore()
        .collection("users")
        .doc(user.uid)
        .get();

      if (snap.exists) {
        const data = snap.data() || {};

        setName(data.name || "");
        setGst(data.gst || "");
        setGstVerified(data.gstVerified || false);
        setAddress(data.address || "");
        setVerificationLevel(data.verificationLevel || "basic");
      }

      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /* ---------------- OTP SEND ---------------- */

  const sendOtp = async () => {
    try {
      const result = await auth().signInWithPhoneNumber(mobile);
      setConfirmation(result);
      Alert.alert("OTP Sent");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  /* ---------------- OTP CONFIRM ---------------- */

  const confirmOtp = async () => {
    try {
      if (!confirmation) return Alert.alert("Send OTP first");

      await confirmation.confirm(otp);

      setIsVerified(true);
      setOtp("");
      Alert.alert("OTP Verified. You can now edit.");
    } catch (e) {
      Alert.alert("Invalid OTP");
    }
  };

  /* ---------------- GST VERIFY / REVERIFY ---------------- */

  const handleGSTAction = async () => {
    if (!isVerified) return Alert.alert("Verify OTP first");

    const normalized = gst.trim().toUpperCase();
    if (normalized.length !== 15)
      return Alert.alert("Invalid GST format");

    try {
      setVerifyingGST(true);
      const user = auth().currentUser;

      const gstDoc = await firestore()
        .collection("gstIndex")
        .doc(normalized)
        .get();

      if (gstDoc.exists) {
        const existingUid = gstDoc.data()?.uid;
        if (existingUid !== user.uid) {
          return Alert.alert("GST already registered");
        }
      }

      const res = await fetch(
        "https://asia-south1-buildo-940cd.cloudfunctions.net/verifyGST",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gstNo: normalized }),
        }
      );

      const data = await res.json();
      if (!data?.valid) return Alert.alert("GST Invalid");

      const updatedName = data.tradeName || name;
      const updatedAddress = data.address || address;

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          name: updatedName,
          address: updatedAddress,
          gst: normalized,
          gstVerified: true,
          verificationLevel: "gst",
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      await firestore()
        .collection("gstIndex")
        .doc(normalized)
        .set({
          uid: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setName(updatedName);
      setAddress(updatedAddress);
      setGstVerified(true);

      Alert.alert("GST Verified & Profile Updated");

      setIsVerified(false);
    } catch (e) {
      Alert.alert("GST Error", e.message);
    } finally {
      setVerifyingGST(false);
    }
  };

  /* ---------------- PROFILE UPDATE ---------------- */

  const handleUpdateProfile = async () => {
    if (!isVerified) return Alert.alert("Verify OTP first");

    try {
      const user = auth().currentUser;

      if (email) await user.updateEmail(email);

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          address,
          email,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert("Profile Updated");
      setIsVerified(false);
    } catch (e) {
      Alert.alert("Update failed", e.message);
    }
  };

  /* ---------------- PASSWORD UPDATE ---------------- */

  const handleChangePassword = async () => {
    if (!isVerified) return Alert.alert("Verify OTP first");

    if (!newPassword || newPassword.length < 6)
      return Alert.alert("Password must be 6+ characters");

    try {
      await auth().currentUser.updatePassword(newPassword);
      Alert.alert("Password Updated");
      setNewPassword("");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return null;
  /* ----------NEW MOBILE OTP --------------*/
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

/* ---------- CHANGE MOBILE ---------------*/

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

    // 1️⃣ Update phone in Firebase
    await user.updatePhoneNumber(credential);

    // 2️⃣ Update email (CRITICAL FOR LABOUR)
    const newEmail = `${cleaned}@labour.buildo`;
    await user.updateEmail(newEmail);

    // 3️⃣ Delete old mobileIndex (strip +91)
    const oldMobile = mobile.replace("+91", "");

    await firestore()
      .collection("mobileIndex")
      .doc(oldMobile)
      .delete();

    // 4️⃣ Add new mobileIndex
    await firestore()
      .collection("mobileIndex")
      .doc(cleaned)
      .set({
        uid: user.uid,
        role: "labour",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    // 5️⃣ Update Firestore user doc
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
        <Text style={styles.title}>Labour Profile</Text>

        <VerificationBadge level={verificationLevel} />

        <TextInput style={styles.input} value={mobile} editable={false} />
        <TextInput style={styles.input} value={name} editable={false} />

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

        {/* GST FIELD */}
        <TextInput
          style={[styles.input, gstVerified && styles.locked]}
          value={gst}
          onChangeText={setGst}
          editable={isVerified && !gstVerified}
          placeholder="GST Number"
          placeholderTextColor="#9CA3AF"
        />

        {isVerified && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleGSTAction}
            disabled={verifyingGST}
          >
            <Text style={styles.buttonText}>
              {gstVerified ? "Re-Verify GST" : "Verify & Update GST"}
            </Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, gstVerified && styles.locked]}
          value={address}
          onChangeText={setAddress}
          editable={isVerified && !gstVerified}
          multiline
        />

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          editable={isVerified}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>

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
  textArea: { height: 90, textAlignVertical: "top" },
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  buttonText: { color: "#0B1F3B", fontWeight: "700", textAlign: "center" },
  locked: { opacity: 0.6 },
  eyeButton: { position: "absolute", right: 16, top: 18 },
  eyeText: { color: "#D4AF37", fontWeight: "600", fontSize: 13 },
});