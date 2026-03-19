import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyListings() {
  const navigation = useNavigation();
  const user = auth().currentUser;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const confirmCancel = (listingId) => {
  Alert.alert(
    "Cancel Listing",
    "Are you sure you want to cancel this listing?",
    [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => cancelListing(listingId),
      },
    ]
  );
};


  useEffect(() => {
    const loadListings = async () => {
      try {
        if (!user) return;

        const snap = await firestore()
          .collection("listings")
          .where("createdBy", "==", user.uid)
          .get();

        const results = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setListings(results);
      } catch (e) {
        console.log("MY LISTINGS ERROR:", e);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  if (loading)
    return (
      <Text style={styles.loading}>
        Loading your listings...
      </Text>
    );

  if (listings.length === 0)
    return (
      <Text style={styles.loading}>
        You haven’t created any listings yet
      </Text>
    );

  const getStatusColor = (status) => {
    if (status === "open") return "#22C55E";
    if (status === "completed") return "#D4AF37";
    if (status === "closed") return "#EF4444";
    return "#C7D2E2";
  };

  const cancelListing = async (listingId) => {
  try {
    await firestore()
      .collection("listings")
      .doc(listingId)
      .update({
        status: "cancelled",
        cancelledAt: firestore.FieldValue.serverTimestamp(),
      });

    // update UI instantly
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { ...item, status: "cancelled" }
          : item
      )
    );

  } catch (error) {
    console.log("CANCEL LISTING ERROR:", error);
  }
};

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.title}
            </Text>

            <Text style={styles.meta}>
            {item.category} • {item.subCategory}
            </Text>
            
            <Text style={styles.meta}>
            📍 {item.subDistrict}, {item.district}, {item.state}
            </Text>
            
            <Text style={styles.meta}>
            ⏳ Completion: {item.workCompletionDays || "-"} days
            </Text>
            
            <Text style={styles.meta}>
            📅 Bid Ends: {item.bidEndDate?.toDate()?.toDateString()}
            </Text>
            
            <Text style={styles.meta}>
            ⏳ Work Type: {item.workType || "-"} 
            </Text>
            
            <Text style={styles.meta}>
            ⏳ Contract Type: {item.contractType || "-"} 
            </Text>

            <Text
              style={[
                styles.status,
                { color: getStatusColor(item.status) },
              ]}
            >
              Status: {item.status}
            </Text>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                navigation.navigate("ViewMyListing", {
                  listingId: item.id,
                })
              }
            >
              <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
            {item.status === "open" && (
  <TouchableOpacity
    style={styles.cancelBtn}
    onPress={() => confirmCancel(item.id)}
  >
    <Text style={styles.cancelText}>Cancel Listing</Text>
  </TouchableOpacity>
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

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  meta: {
    marginTop: 6,
    color: "#9CA3AF",
  },

  status: {
    marginTop: 8,
    fontWeight: "700",
  },

  viewBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#D4AF37",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },

  viewText: {
    color: "#0B1F3B",
    fontWeight: "700",
  },
  cancelBtn: {
  marginTop: 10,
  alignSelf: "flex-start",
  backgroundColor: "#EF4444",
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 12,
},

cancelText: {
  color: "#FFFFFF",
  fontWeight: "700",
}
});