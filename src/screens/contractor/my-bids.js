import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";
import VerificationBadge from "../../components/VerificationBadge";

export default function MyBids() {
  const user = auth.currentUser;

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyBids = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "bids"),
          where("bidBy", "==", user.uid)
        );

        const bidSnap = await getDocs(q);
        const results = [];

        for (const bidDoc of bidSnap.docs) {
          const bidData = bidDoc.data();

          const listingSnap = await getDoc(
            doc(db, "listings", bidData.listingId)
          );

          if (!listingSnap.exists()) continue;

          const listingData = listingSnap.data();

          results.push({
            id: bidDoc.id,
            ...bidData,
            listing: listingData,
          });
        }

        setBids(results);
      } catch (e) {
        console.log("MY BIDS ERROR:", e);
      } finally {
        setLoading(false);
      }
    };

    loadMyBids();
  }, []);

  if (loading)
    return <Text style={styles.loading}>Loading your bids...</Text>;

  if (bids.length === 0)
    return <Text style={styles.loading}>You haven’t placed any bids yet</Text>;

  const getStatus = (item) => {
    if (item.listing.awardedBidId === item.id) {
      if (item.listing.status === "completed") {
        return { text: "Project Completed ✅", color: "#16a34a" };
      }
      return { text: "You Won 🎉", color: "#16a34a" };
    }

    if (item.status === "rejected") {
      return { text: "Not Selected", color: "#ef4444" };
    }

    return { text: "Pending", color: "#0a57f1" };
  };

  return (
    <FlatList
      data={bids}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const status = getStatus(item);

        return (
          <View style={styles.card}>
            <Text style={styles.amount}>₹ {item.amount}</Text>

            <Text style={styles.title}>{item.listing.title}</Text>

            <View style={styles.row}>
              <Text style={styles.creator}>
                {item.listing.createdByCompanyName || "Listing Owner"}
              </Text>
              <VerificationBadge
                level={item.listing.createdByVerificationLevel || "basic"}
              />
            </View>

            <Text style={styles.meta}>
              {item.listing.location} • {item.listing.category}
            </Text>

            {item.message ? (
              <Text style={styles.msg}>{item.message}</Text>
            ) : null}

            <Text style={{
              marginTop: 8,
              fontWeight: "bold",
              color: status.color
            }}>
              {status.text}
            </Text>

            <Text style={styles.date}>
              Bid placed on{" "}
              {item.createdAt?.toDate()?.toDateString() || "—"}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },
  title: {
    marginTop: 6,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  creator: {
    fontWeight: "600",
    color: "#285399",
  },
  meta: {
    color: "#6b7280",
    marginTop: 4,
  },
  msg: {
    marginTop: 6,
    color: "#374151",
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
  },
});
