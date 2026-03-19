import { useNavigation } from "@react-navigation/native";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterRole() {
  const navigation = useNavigation();

  const goToOtp = (role) => {
    navigation.navigate("RegisterPhone", { role });
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.brand}>TORVANTA</Text>
      <Text style={styles.subtitle}>
        Choose your registration category
      </Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => goToOtp("company")}
        >
          <Text style={styles.buttonText}>COMPANY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => goToOtp("contractor")}
        >
          <Text style={styles.buttonText}>CONTRACTOR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => goToOtp("labour")}
        >
          <Text style={styles.buttonText}>LABOUR CONTRACTOR</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    width: 90,
    height: 90,
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
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  buttonText: {
    color: "#0B1F3B",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 1,
  },
});