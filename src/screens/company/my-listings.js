import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function MyListings() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const q = query(
          collection(db, "listings"),
          where("createdBy", "==", user.uid)
        );

        const snap = await getDocs(q);

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
    return <Text style={styles.loading}>Loading your listings...</Text>;

  if (listings.length === 0)
    return (
      <Text style={styles.loading}>You haven’t created any listings yet</Text>
    );

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.meta}>
            {item.location} • {item.category}
          </Text>

          <Text style={styles.status}>
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
        </View>
      )}
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
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  meta: {
    marginTop: 4,
    color: "#6b7280",
  },
  status: {
    marginTop: 6,
    fontWeight: "bold",
    color: "#2563eb",
  },
  viewBtn: {
    marginTop: 10,
  },
  viewText: {
    color: "#2563eb",
    fontWeight: "bold",
  },
});
