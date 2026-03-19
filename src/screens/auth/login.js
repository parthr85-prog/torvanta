import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { setRegistering } from "../../../registrationState";

export default function Login() {
  const navigation = useNavigation();

  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ added

  const handleLogin = async () => {
    if (loading) return;
    if (!emailOrMobile || !password) {
      Alert.alert("Error", "Email/Mobile and password are required");
      return;
    }

    let loginEmail = emailOrMobile.trim();

    // 📱 Labour login via mobile
    if (/^[0-9]{10}$/.test(loginEmail)) {
      loginEmail = `${loginEmail}@labour.buildo`;
    }

    try {
      setLoading(true);
      setRegistering(false);

      await auth().signInWithEmailAndPassword(loginEmail, password);

    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };
const contactSupport = () => {
  Linking.openURL(
    "mailto:info@torvanta.in?subject=Torvanta Support Request"
  );
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
      <Text style={styles.subtitle}>
        Powering India's Construction Workforce
      </Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email or Mobile Number"
          placeholderTextColor="#8FA3BF"
          value={emailOrMobile}
          onChangeText={setEmailOrMobile}
          autoCapitalize="none"
        />

        {/* ✅ Password Field With Toggle */}
        <View style={{ position: "relative" }}>
          <TextInput
            style={styles.input}
            placeholder="Password"
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

        <TouchableOpacity
  style={{ alignSelf: "flex-end", marginBottom: 14 }}
  onPress={() => navigation.navigate("ForgotPassword")}
>
  <Text style={{ color: "#D4AF37", fontSize: 13, fontWeight: "600" }}>
    Forgot Password?
  </Text>
</TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 22 }}
          onPress={() => navigation.navigate("RegisterRole")}
        >
          <Text style={styles.link}>New user? Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.helpContainer}
  onPress={contactSupport}
>
  <Text style={styles.helpText}>
    📧 For assistance: info@torvanta.in
  </Text>
</TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1F3B",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 12,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  subtitle: {
    textAlign: "center",
    color: "#C7D2E2",
    marginBottom: 40,
    marginTop: 6,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#122A4D",
    padding: 24,
    borderRadius: 18,
  },
  input: {
    backgroundColor: "#0E2445",
    borderRadius: 14,
    padding: 15,
    marginBottom: 18,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1E3A63",
    fontSize: 15,
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
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 5,
  },
  buttonText: {
    color: "#0B1F3B",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    color: "#D4AF37",
    fontWeight: "600",
    fontSize: 14,
  },
  helpContainer:{
  marginTop:18,
  alignItems:"center"
},

helpText:{
  color:"#C7D2E2",
  fontSize:12
},
});