import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../../firebaseConfig";

export default function Login() {
  const navigation = useNavigation();

  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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
      await signInWithEmailAndPassword(auth, loginEmail, password);

      // ❗ DO NOT navigate here
      // RootNavigator handles redirect based on role

    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Mobile Number"
        value={emailOrMobile}
        onChangeText={setEmailOrMobile}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => navigation.navigate("RegisterRole")}
      >
        <Text style={styles.link}>New user? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "bold",
  },
});
