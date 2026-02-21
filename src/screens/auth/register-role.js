import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RegisterRole() {
  const navigation = useNavigation();

  const goToOtp = (role) => {
    navigation.navigate("RegisterPhone", { role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToOtp("company")}
      >
        <Text style={styles.buttonText}>Company</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToOtp("contractor")}
      >
        <Text style={styles.buttonText}>Contractor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToOtp("labour")}
      >
        <Text style={styles.buttonText}>Labour Contractor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
