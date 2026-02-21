import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";


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
        const q = query(
          collection(db, "bids"),
          where("listingId", "==", listingId)
        );

        const snap = await getDocs(q);
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
    <FlatList
      data={bids}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.amount}>₹ {item.amount}</Text>
          <Text style={styles.name}>{item.bidByName}</Text>

          {item.message ? (
            <Text style={styles.msg}>{item.message}</Text>
          ) : null}

          <Text style={styles.date}>
            {item.createdAt?.toDate().toDateString()}
          </Text>

          {/* 📎 BIDDER DOCUMENTS */}
          {item.documents && item.documents.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>Documents</Text>

              {item.documents.map((doc, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => openDocument(doc.url)}
                  style={{ marginTop: 4 }}
                >
                  <Text style={{ color: "#2563eb" }}>
                    📄 {doc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#f3efef",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  amount: { fontSize: 18, fontWeight: "bold", color: "#16a34a" },
  name: { marginTop: 4, fontWeight: "bold" },
  msg: { marginTop: 6, color: "#0c63f0" },
  date: { marginTop: 6, fontSize: 12, color: "#697489" },
});
