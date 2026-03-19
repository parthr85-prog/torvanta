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

export default function RegisterCompany() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mobile } = route.params;

  const role = "company";
const [hasGST, setHasGST] = useState(false);
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
const verificationLevel = "gst";
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [acceptTerms, setAcceptTerms] = useState(false);
const [acceptPrivacy, setAcceptPrivacy] = useState(false);
const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
const [acceptRefund, setAcceptRefund] = useState(false);


  /* ---------------- CHECK MOBILE INDEX ---------------- */
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

      const res = await fetch(
        "https://asia-south1-buildo-940cd.cloudfunctions.net/verifyGST",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gstNo: normalizedGst }),
        }
      );

      const data = await res.json();

      if (!data.valid) {
        setVerifyingGST(false);
        Alert.alert("GST Invalid", "GST number not found");
        return;
      }

      setCompanyName(data.tradeName);
      setAuthorizedPerson(data.legalName);
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

  /* ---------------- HANDLE SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (loading) return;
    const currentUser = auth().currentUser;

    if (!currentUser) {
      Alert.alert("Session expired", "Verify mobile again");
      return;
    }

    if (!gstVerified) {
      Alert.alert("Verify GST", "GST verification required");
      return;
    }

    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
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
    

    if(!acceptTerms || !acceptPrivacy || !acceptDisclaimer || !acceptRefund){

Alert.alert(
"Agreement Required",
"Please accept all policies before continuing."
);

return;
}

    try {
      setLoading(true);

      const emailCredential =
        auth.EmailAuthProvider.credential(email, password);

      await currentUser.linkWithCredential(emailCredential);

      const uid = currentUser.uid;

      await saveUserProfile({
  uid,
  role,
  mobile,
  companyName,
  authorizedPerson,
  email,
  gst: gstVerified ? gst.trim().toUpperCase() : null,
  gstVerified: gstVerified,
  verificationLevel: "gst",
  pincode,
  city,
  state,
  address,
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

      /* -------- CREATE GST INDEX -------- */
       /* -------- CREATE GST INDEX -------- */
const normalizedGst = gst.trim().toUpperCase();

await firestore()
  .collection("gstIndex")
  .doc(normalizedGst)
  .set({
    uid,
    role,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
/* ---------------------------------- */
      /* ---------------------------------- */

      Alert.alert("Success", "Company registered successfully");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      setRegistering(false);
    } catch (e) {
      setLoading(false);
      console.log("COMPAANY REGISTER ERROR:", e);
      Alert.alert("Registration failed", e.message);
     
    } 
    
  };

  /* ---------------- UI ---------------- */
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.brand}>TORVANTA</Text>
      <Text style={styles.title}>Company Registration</Text>

      <View style={styles.card}>
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
            {verifyingGST
              ? "Verifying..."
              : gstVerified
              ? "GST Verified ✅"
              : "Verify GST"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Company Name"
          placeholderTextColor="#8FA3BF"
          value={companyName}
          onChangeText={setCompanyName}
          editable={!gstVerified}
        />

        <TextInput
          style={styles.input}
          placeholder="Authorized Person"
          placeholderTextColor="#8FA3BF"
          value={authorizedPerson}
          onChangeText={setAuthorizedPerson}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8FA3BF"
          value={email}
          onChangeText={setEmail}
        />

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
          placeholder="Pincode"
          placeholderTextColor="#8FA3BF"
          value={pincode}
          onChangeText={setPincode}
          editable={!gstVerified}
        />

        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor="#8FA3BF"
          value={city}
          editable={!gstVerified}
        />

        <TextInput
          style={styles.input}
          placeholder="State"
          placeholderTextColor="#8FA3BF"
          value={state}
          editable={!gstVerified}
        />

        <TextInput
          style={[styles.input, styles.address]}
          placeholder="Address"
          placeholderTextColor="#8FA3BF"
          value={address}
          onChangeText={setAddress}
          multiline
          editable={!gstVerified}
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
  address: { height: 80, textAlignVertical: "top" },
  primaryButton: { backgroundColor: "#D4AF37", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  primaryButtonText: { color: "#0B1F3B", textAlign: "center", fontWeight: "700", letterSpacing: 1 },
  secondaryButton: { backgroundColor: "#D4AF37", paddingVertical: 12, borderRadius: 12, marginBottom: 18 },
  secondaryButtonText: { textAlign: "center", fontWeight: "600", color: "#0B1F3B" },
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