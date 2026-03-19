import firestore from "@react-native-firebase/firestore";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ViewBids() {
  const { listingId } = useLocalSearchParams();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const openDocument = async (url) => {
    await Linking.openURL(url);
  };

  useEffect(() => {
    if (!listingId) return;

    const fetchBids = async () => {
      try {
        const snap = await firestore()
          .collection("bids")
          .where("listingId", "==", listingId)
          .get();

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setBids(data);
      } catch (e) {
        console.log("BIDS FETCH ERROR:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [listingId]);

  if (loading) {
    return <Text style={styles.loading}>Loading bids...</Text>;
  }

  if (bids.length === 0) {
    return <Text style={styles.loading}>No bids received yet</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>₹ {item.amount}</Text>

            <Text style={styles.name}>{item.bidByName}</Text>

            {item.message ? (
              <Text style={styles.msg}>{item.message}</Text>
            ) : null}

            <Text style={styles.date}>
              {item.createdAt?.toDate()?.toDateString() || "—"}
            </Text>

            {item.documents && item.documents.length > 0 && (
              <View style={styles.docContainer}>
                <Text style={styles.docTitle}>Documents</Text>

                {item.documents.map((doc, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => openDocument(doc.url)}
                    style={styles.docBtn}
                  >
                    <Text style={styles.docText}>
                      📄 {doc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1F3B",
  },

  loading: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 16,
    color: "#C7D2E2",
  },

  card: {
    backgroundColor: "#122A4D",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E3A63",
  },

  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D4AF37",
  },

  name: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  msg: {
    marginTop: 8,
    color: "#C7D2E2",
  },

  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#94A3B8",
  },

  docContainer: {
    marginTop: 12,
  },

  docTitle: {
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  docBtn: {
    backgroundColor: "#1E3A63",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },

  docText: {
    color: "#D4AF37",
    fontWeight: "600",
  },
});