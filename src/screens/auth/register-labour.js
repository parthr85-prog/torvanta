import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setRegistering } from "../../../registrationState";
import { saveUserProfile } from "../../../saveUserProfile";
import { checkMobileIndex } from "../../../utils/checkMobileIndex";

import { Ionicons } from "@expo/vector-icons";

export default function RegisterLabour() {
  const navigation = useNavigation();
  const route = useRoute();

  const role = "labour";
  const { mobile } = route.params;

  const [hasGST, setHasGST] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gst, setGst] = useState("");
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [acceptTerms, setAcceptTerms] = useState(false);
const [acceptPrivacy, setAcceptPrivacy] = useState(false);
const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
const [acceptRefund, setAcceptRefund] = useState(false);

  /* ---------------- MOBILE UNIQUENESS ---------------- */

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
          routes: [{ name: "Login" }],
        });
      }
    };

    verifyMobileUniqueness();
  }, []);

  /* ---------------- GST VERIFY ---------------- */

 const verifyGST = async () => {
    const normalizedGst = gst.trim().toUpperCase();
    if (normalizedGst.length !== 15) {
      Alert.alert("Invalid GST", "Enter 15-digit GST number");
      return;
    }

    try {
      setVerifyingGST(true);

      /* -------- GST UNIQUENESS CHECK FIRST -------- */

const gstDoc = await firestore()
  .collection("gstIndex")
  .doc(normalizedGst)
  .get();

console.log("Exists:", gstDoc.exists());

if (gstDoc.exists()) {
  Alert.alert("GST Already Registered");
  setVerifyingGST(false);
  return;
}
      /* -------------------------------------------- */

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
        setVerifyingGST(false);
        Alert.alert("GST Invalid", "GST number not found");
        setVerifyingGST(false);
        return;
      }

      setName(data.tradeName);
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

  /* ---------------- PIN FETCH ---------------- */

  const handlePincodeChange = async (value) => {
    setPincode(value);

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

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (loading) return;
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert("Session expired", "Verify mobile again");
      return;
    }
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

    if(!acceptTerms || !acceptPrivacy || !acceptDisclaimer || !acceptRefund){

Alert.alert(
"Agreement Required",
"Please accept all policies before continuing."
);

return;
}

    try {
      const user = auth().currentUser; // ✅ existing phone user
      const uid = user.uid;

      const loginEmail = `${mobile}@labour.buildo`;

      // 🔥 LINK email/password to existing phone user
      const emailCredential = auth.EmailAuthProvider.credential(
        loginEmail,
        password
      );

      await user.linkWithCredential(emailCredential);

      await saveUserProfile({
        uid,
        role: "labour",
        mobile,
        name,
        email:loginEmail,
        hasGST,
        gst: hasGST ? gst.trim().toUpperCase() : null,
        gstVerified: hasGST ? true : false,
        address,
        city,
        state,
        pincode,
        createdAt: firestore.FieldValue.serverTimestamp(),
        termsAccepted: true,
privacyAccepted: true,
disclaimerAccepted: true,
refundAccepted: true,
acceptedAt: firestore.FieldValue.serverTimestamp()
      });

      await firestore()
        .collection("mobileIndex")
        .doc(mobile)
        .set({
          uid,
          role,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      if (hasGST && gstVerified) {
        const normalizedGst = gst.trim().toUpperCase();
        await firestore()
          .collection("gstIndex")
          .doc(normalizedGst)
          .set({
            uid,
            role,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      Alert.alert("Success", "Labour Contractor registered successfully");

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      setRegistering(false);
    } catch (error) {
      setLoading(false);
      console.log("LABOUR REGISTER ERROR:", error);
      Alert.alert("Registration Failed", error.message);
    }
    
  };

  /* ---------------- UI ---------------- */

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.brand}>TORVANTA</Text>
      <Text style={styles.title}>Labour Contractor Registration</Text>

      <View style={styles.card}>
        {hasGST && (
          <>
            <TextInput
              style={styles.input}
              placeholder="GST Number"
              placeholderTextColor="#8FA3BF"
              value={gst}
              onChangeText={(t) => setGst(t.toUpperCase())}
              editable={!gstVerified}
            />

            <TouchableOpacity
              onPress={verifyGST}
              disabled={gstVerified || verifyingGST}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {gstVerified ? "GST Verified ✅" : "Verify GST"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setHasGST(!hasGST);
            if (!hasGST) {
              setGst("");
              setGstVerified(false);
            }
          }}
        >
          <Text style={styles.toggleText}>
            {hasGST ? "I don't have GST" : "GST Available ✓"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            hasGST && gstVerified ? styles.readOnly : null
          ]}
          placeholder="Contractor Name *"
          placeholderTextColor="#8FA3BF"
          value={name}
          onChangeText={setName}
          editable={!(hasGST && gstVerified)}
        />

        <TextInput style={styles.readOnly} value={mobile} editable={false} />

        <View style={{ position: "relative" }}>
  <TextInput
    style={styles.input}
    placeholder="Create Password *"
    placeholderTextColor="#8FA3BF"
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
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

        <View style={{ position: "relative" }}>
  <TextInput
    style={styles.input}
    placeholder="Confirm Password *"
    placeholderTextColor="#8FA3BF"
    secureTextEntry={!showConfirmPassword}
    value={confirmPassword}
    onChangeText={setConfirmPassword}
  />

  <TouchableOpacity
    onPress={() =>
      setShowConfirmPassword(!showConfirmPassword)
    }
    style={styles.eyeButton}
  >
    <Text style={styles.eyeText}>
      {showConfirmPassword ? "Hide" : "Show"}
    </Text>
  </TouchableOpacity>
</View>

        <TextInput
          style={styles.input}
          placeholder="PIN Code *"
          placeholderTextColor="#8FA3BF"
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
          placeholderTextColor="#8FA3BF"
          multiline
          value={address}
          onChangeText={setAddress}
        />

        <View style={{marginTop:20}}>

{/* Terms */}

<TouchableOpacity
style={styles.checkboxRow}
onPress={()=>setAcceptTerms(!acceptTerms)}
>
<Ionicons
name={acceptTerms ? "checkbox" : "square-outline"}
size={22}
color="#D4AF37"
/>

<Text style={styles.checkboxText}>
I agree to the{" "}
<Text
style={styles.link}
onPress={()=>navigation.navigate("LegalPage",{
url:"https://torvanta.in/terms-conditions"
})}
>
Terms and Conditions
</Text>
</Text>

</TouchableOpacity>

{/* Privacy */}

<TouchableOpacity
style={styles.checkboxRow}
onPress={()=>setAcceptPrivacy(!acceptPrivacy)}
>
<Ionicons
name={acceptPrivacy ? "checkbox" : "square-outline"}
size={22}
color="#D4AF37"
/>

<Text style={styles.checkboxText}>
  I accept the{" "}
<Text
style={styles.link}
onPress={()=>navigation.navigate("LegalPage",{
url:"https://torvanta.in/privacy-policy"
})}
>
Privacy Policy
</Text>
</Text>

</TouchableOpacity>

{/* Disclaimer */}

<TouchableOpacity
style={styles.checkboxRow}
onPress={()=>setAcceptDisclaimer(!acceptDisclaimer)}
>
<Ionicons
name={acceptDisclaimer ? "checkbox" : "square-outline"}
size={22}
color="#D4AF37"
/>

<Text style={styles.checkboxText}>
I accept the{" "}
<Text
style={styles.link}
onPress={()=>navigation.navigate("LegalPage",{
url:"https://torvanta.in/disclaimer"
})}
>
Disclaimer
</Text>
</Text>

</TouchableOpacity>

{/* Refund */}

<TouchableOpacity
style={styles.checkboxRow}
onPress={()=>setAcceptRefund(!acceptRefund)}
>
<Ionicons
name={acceptRefund ? "checkbox" : "square-outline"}
size={22}
color="#D4AF37"
/>

<Text style={styles.checkboxText}>
I agree to the{" "}
<Text
style={styles.link}
onPress={()=>navigation.navigate("LegalPage",{
url:"https://torvanta.in/refund-policy"
})}
>
Refund Policy
</Text>
</Text>

</TouchableOpacity>

</View>

         <TouchableOpacity style={[styles.primaryButton, !(acceptTerms && acceptPrivacy && acceptDisclaimer && acceptRefund) && {opacity:0.4}
                ]} disabled={!(acceptTerms && acceptPrivacy && acceptDisclaimer && acceptRefund)}
                 onPress={handleSubmit}>
                  <Text style={styles.primaryButtonText}>
                    {loading ? "Submitting..." : "SUBMIT"}
                  </Text>
                </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#0B1F3B" },
  logo: { width: 80, height: 80, alignSelf: "center", marginBottom: 10 },
  brand: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", textAlign: "center", letterSpacing: 1.5 },
  title: { fontSize: 18, color: "#C7D2E2", textAlign: "center", marginBottom: 30 },
  card: { backgroundColor: "#122A4D", padding: 24, borderRadius: 18 },
  input: { backgroundColor: "#0E2445", borderRadius: 14, padding: 14, marginBottom: 16, color: "#FFFFFF", borderWidth: 1, borderColor: "#1E3A63" },
  readOnly: { backgroundColor: "#1E3A63", borderRadius: 14, padding: 14, marginBottom: 16, color: "#FFFFFF" },
  textArea: { height: 80, textAlignVertical: "top" },
  primaryButton: { backgroundColor: "#D4AF37", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  primaryButtonText: { color: "#0B1F3B", textAlign: "center", fontWeight: "700", letterSpacing: 1 },
  secondaryButton: { backgroundColor: "#D4AF37", paddingVertical: 12, borderRadius: 12, marginBottom: 15 },
  secondaryButtonText: { textAlign: "center", fontWeight: "600", color: "#0B1F3B" },
  toggleButton: { backgroundColor: "#1E3A63", padding: 12, borderRadius: 12, marginBottom: 18 },
  toggleText: { textAlign: "center", color: "#FFFFFF", fontWeight: "600" },
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

checkboxRow:{
flexDirection:"row",
alignItems:"center",
marginBottom:10
},

checkboxText:{
color:"#C7D2E2",
marginLeft:8,
flex:1,
fontSize:13
},

link:{
color:"#D4AF37",
fontWeight:"600"
}
});