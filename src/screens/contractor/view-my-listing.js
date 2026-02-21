import { useNavigation, useRoute } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";
import VerificationBadge from "../../components/VerificationBadge";

export default function ViewMyListing() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listingId } = route.params;

  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- ACCEPT BID ---------------- */
  const acceptBid = async (bid) => {
    try {
      await updateDoc(doc(db, "listings", listing.id), {
        status: "awarded",
        awardedTo: bid.bidBy,
        awardedBidId: bid.id,
      });

      const bidsQuery = query(
        collection(db, "bids"),
        where("listingId", "==", listing.id)
      );

      const bidsSnap = await getDocs(bidsQuery);

      for (const b of bidsSnap.docs) {
        if (b.id === bid.id) {
          await updateDoc(b.ref, { status: "awarded" });

          await addDoc(collection(db, "users", bid.bidBy, "notifications"), {
            userId: bid.bidBy,
            type: "BID_AWARDED",
            title: "Your bid was accepted 🎉",
            message: `Your bid on "${listing.title}" has been accepted.`,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(b.ref, { status: "rejected" });

          await addDoc(collection(db, "users", b.data().bidBy, "notifications"), {
            userId: b.data().bidBy,
            type: "BID_REJECTED",
            title: "Bid not selected",
            message: `Your bid on "${listing.title}" was not selected.`,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      Alert.alert("Success", "Bid awarded successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  /* ---------------- MARK COMPLETED ---------------- */
  const markCompleted = async () => {
    try {
      if (!listing.awardedTo) return;

      await updateDoc(doc(db, "listings", listing.id), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", listing.awardedTo), {
        ongoingProjects: increment(-1),
        totalProjectsCompleted: increment(1),
      });

      navigation.navigate("RateUser", {
        userId: listing.awardedTo,
        listingId: listing.id,
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const loadBids = async () => {
      try {
        const listingSnap = await getDoc(doc(db, "listings", listingId));
        if (!listingSnap.exists()) return;

        const listingData = {
          id: listingSnap.id,
          ...listingSnap.data(),
        };

        setListing(listingData);

        const q = query(
          collection(db, "bids"),
          where("listingId", "==", listingId)
        );

        const snap = await getDocs(q);

        const results = [];

        for (const bidDoc of snap.docs) {
          const bidData = bidDoc.data();

          const userSnap = await getDoc(
            doc(db, "users", bidData.bidBy)
          );

          results.push({
            id: bidDoc.id,
            ...bidData,
            bidderProfile: userSnap.exists()
              ? userSnap.data()
              : null,
          });
        }

        setBids(results);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    loadBids();
  }, []);

  if (loading || !listing) return null;

  /* ---------------- RENDER BID CARD ---------------- */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ViewUserProfile", {
            userId: item.bidBy,
          })
        }
      >
        <Text style={styles.bidderName}>
          {item.bidderProfile?.name || "User"}
        </Text>
      </TouchableOpacity>

      <VerificationBadge
        level={item.bidderProfile?.verificationLevel || "basic"}
      />

      <Text style={styles.amount}>₹ {item.amount}</Text>

      {item.message ? (
        <Text style={styles.msg}>{item.message}</Text>
      ) : null}

      <Text style={styles.date}>
        {item.createdAt?.toDate()?.toDateString()}
      </Text>

      {/* ACCEPT BUTTON */}
      {listing.status === "open" && (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => acceptBid(item)}
        >
          <Text style={styles.btnText}>Accept Bid</Text>
        </TouchableOpacity>
      )}

      {/* AWARDED LABEL */}
      {listing.status === "awarded" &&
        listing.awardedBidId === item.id && (
          <View style={styles.awarded}>
            <Text style={styles.btnText}>✔ Awarded</Text>
          </View>
        )}

      {/* REJECTED LABEL */}
      {listing.status === "awarded" &&
        listing.awardedBidId !== item.id && (
          <View style={styles.rejected}>
            <Text>Not Selected</Text>
          </View>
        )}

      {/* COMPLETE BUTTON */}
      {listing.status === "awarded" &&
        listing.awardedTo === item.bidBy && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={markCompleted}
          >
            <Text style={styles.btnText}>
              Mark Work Completed
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    <FlatList
      data={bids}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.meta}>
            {listing.location} • {listing.category}
          </Text>
          <Text style={styles.section}>Received Bids</Text>
        </View>
      }
      contentContainerStyle={{ padding: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  meta: { color: "#6b7280" },
  section: { marginTop: 20, fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  bidderName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  amount: {
    fontWeight: "bold",
    color: "#2563eb",
  },
  msg: { marginTop: 6 },
  date: { fontSize: 12, color: "#6b7280" },
  acceptBtn: {
    backgroundColor: "#16a34a",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  awarded: {
    backgroundColor: "#22c55e",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rejected: {
    backgroundColor: "#e5e7eb",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  completeBtn: {
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
