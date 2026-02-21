import { StyleSheet, Text, View } from "react-native";

export default function VerificationBadge({ level }) {
  if (!level || level === "basic") return null;

  let label = "";
  let backgroundColor = "";

  if (level === "gst") {
    label = "GST Verified";
    backgroundColor = "#16a34a";
  }

  if (level === "verified") {
    label = "Buildo Verified";
    backgroundColor = "#2563eb";
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  text: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
