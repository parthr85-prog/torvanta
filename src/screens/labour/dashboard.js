import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";
import VerificationBadge from "../../components/VerificationBadge";
import DashboardHeader from "../company/DashboardHeader";


export default function ContractorDashboard() {
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [labourContractorName, setlabourContractorName] = useState("");
 const [verificationLevel, setVerificationLevel] = useState("basic");

  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  



  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    if (!currentUser) return;
  const loadProfile = async () => {
    try {
      if (!currentUser) return;

      const snap = await getDoc(
        doc(db, "users", currentUser.uid)
      );

      if (!snap.exists()) {
        console.log("Contractor profile not found");
        return;
      }

      const data = snap.data();
      setlabourContractorName(data.name || "");
      setVerificationLevel(data.verificationLevel || "basic");
    } catch (error) {
      console.log("PROFILE LOAD ERROR:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  loadProfile();
}, []);


  /* ---------------- LOAD LISTINGS ---------------- */
  /* ---------------- LOAD LISTINGS ---------------- */
useEffect(() => {
  const fetchListings = async () => {
    try {
      const now = new Date();

      // Get my bids first
      const myBidsQuery = query(
        collection(db, "bids"),
        where("bidBy", "==", currentUser.uid)
      );

      const myBidsSnap = await getDocs(myBidsQuery);
      const myBidListingIds = myBidsSnap.docs.map(
        (d) => d.data().listingId
      );

      const q = query(
        collection(db, "listings"),
        where("status", "==", "open"),
        where("createdBy", "!=", currentUser.uid),
        where("bidEndDate", ">", now)
      );

      const snapshot = await getDocs(q);
      const results = [];

      for (const d of snapshot.docs) {
        const data = d.data();

        if (myBidListingIds.includes(d.id)) continue;

        results.push({ id: d.id, ...data });
      }

      setListings(results);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingListings(false);
    }
  };

  fetchListings();
}, []);


  function renderItem({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.company}>
  {item.createdByCompanyName}
</Text>
<VerificationBadge level={item.createdByVerificationLevel} />

      <Text style={styles.meta}>
        {item.location} • {item.category}
      </Text>

      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() =>
          navigation.getParent().navigate("ViewListing", { listingId: item.id })
        }
      >
        <Text style={styles.viewText}>View Listing</Text>
      </TouchableOpacity>
    </View>
  );
}

  return (
    <View style={{ flex: 1 }}>
      <DashboardHeader
        title={
          loadingProfile
            ? "Welcome"
            : `Welcome, ${labourContractorName}`
        }
      />
 {/* 🔵 Show company badge near header */}
            <View style={{ paddingHorizontal: 16 }}>
              <VerificationBadge level={verificationLevel} />
            </View>
      {loadingListings ? (
        <Text style={styles.loading}>Loading listings...</Text>
      ) : listings.length === 0 ? (
        <Text style={styles.loading}>No open listings available</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
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
  company: {
  marginTop: 4,
  fontWeight: "600",
  color: "#285399",
},
  meta: {
    marginTop: 4,
    color: "#6b7280",
  },
  viewBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  viewText: {
    color: "#2563eb",
    fontWeight: "bold",
  },
});