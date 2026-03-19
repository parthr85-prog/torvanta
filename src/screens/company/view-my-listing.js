import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VerificationBadge from "../../components/VerificationBadge";


export default function ViewMyListing() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listingId } = route.params;

  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const openDocument = (url)=>{
Linking.openURL(url);
};

  const acceptBid = async (bid) => {
    try {
      await firestore()
        .collection("listings")
        .doc(listing.id)
        .update({
          status: "awarded",
          awardedTo: bid.bidBy,
          awardedBidId: bid.id,
          workStartDate: firestore.FieldValue.serverTimestamp(),
        });

      const bidsSnap = await firestore()
        .collection("bids")
        .where("listingId", "==", listing.id)
        .get();

      for (const b of bidsSnap.docs) {
        if (b.id === bid.id) {
          await b.ref.update({ status: "awarded" });

          await firestore()
            .collection("users")
            .doc(bid.bidBy)
            .collection("notifications")
            .add({
              userId: bid.bidBy,
              type: "BID_AWARDED",
              title: "Your bid was accepted 🎉",
              message: `Your bid on "${listing.title}" has been accepted.`,
              isRead: false,
              createdAt: firestore.FieldValue.serverTimestamp(),
            });
        } else {
          await b.ref.update({ status: "rejected" });

          await firestore()
            .collection("users")
            .doc(b.data().bidBy)
            .collection("notifications")
            .add({
              userId: b.data().bidBy,
              type: "BID_REJECTED",
              title: "Bid not selected",
              message: `Your bid on "${listing.title}" was not selected.`,
              isRead: false,
              createdAt: firestore.FieldValue.serverTimestamp(),
            });
        }
      }

      Alert.alert("Success", "Bid awarded successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const markCompleted = async () => {
    try {
      if (!listing.awardedTo) return;

      await firestore()
        .collection("listings")
        .doc(listing.id)
        .update({
          status: "completed",
          completedAt: firestore.FieldValue.serverTimestamp(),
        });

        await firestore()
.collection("users")
.doc(listing.awardedTo)
.collection("notifications")
.add({
type:"RATE_LISTING_CREATOR",
listingId:listing.id,
title:"Work marked completed",
message:`The project "${listing.title}" was marked completed. Please rate the listing creator.`,
isRead:false,
createdAt:firestore.FieldValue.serverTimestamp()
});

      navigation.navigate("RateUser", {
        userId: listing.awardedTo,
        listingId: listing.id,
      });

      
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  useEffect(() => {
    const loadBids = async () => {
      try {
        const listingSnap = await firestore()
          .collection("listings")
          .doc(listingId)
          .get();

        if (!listingSnap.exists) return;

        const listingData = {
          id: listingSnap.id,
          ...listingSnap.data(),
        };

        setListing(listingData);

        const snap = await firestore()
          .collection("bids")
          .where("listingId", "==", listingId)
          .get();

        const results = [];

        for (const bidDoc of snap.docs) {
          const bidData = bidDoc.data();

          const userSnap = await firestore()
            .collection("users")
            .doc(bidData.bidBy)
            .get();

          results.push({
            id: bidDoc.id,
            ...bidData,
            bidderProfile: userSnap.exists
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

  const isCompletionPeriodOver = () => {

if(!listing.workStartDate || !listing.workCompletionDays)
return false;

const start =
listing.workStartDate.toDate();

const completion =
new Date(start);

completion.setDate(
completion.getDate() + listing.workCompletionDays
);

return new Date() >= completion;

};

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
          {item.bidderProfile?.companyName ||
item.bidderProfile?.name ||
item.bidderProfile?.name ||
"User"}
        </Text>
      </TouchableOpacity>

      <VerificationBadge
        level={
          item.bidderProfile?.verificationLevel || "basic"
        }
      />

      <Text style={styles.amount}>₹ {item.amount}</Text>

<Text style={{color:"#C7D2E2",marginTop:4}}>
GST: {item.taxType === "inclusive" ? "Inclusive" : "Exclusive"}
</Text>

      <Text style={styles.msg}>
Message: {item.message || "No message provided"}
</Text>

      <Text style={styles.date}>
        {item.createdAt?.toDate()?.toDateString()}
      </Text>

      {item.documents?.length > 0 && (

<View style={{marginTop:10}}>

<Text style={styles.section}>
Bid Documents
</Text>

{item.documents.map((doc,index)=>(
<View key={index} style={{marginTop:6}}>

<View style={{flexDirection:"row",justifyContent:"space-between"}}>

<Text style={{color:"#C7D2E2"}}>
📄 {doc.name}
</Text>

<TouchableOpacity
style={styles.downloadBtn}
onPress={()=>openDocument(doc.url)}
>

<Text style={{color:"#0B1F3B",fontWeight:"700"}}>
Open
</Text>

</TouchableOpacity>

</View>

</View>
))}

</View>

)}

      {listing.status === "open" && (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => acceptBid(item)}
        >
          <Text style={styles.btnText}>Accept Bid</Text>
        </TouchableOpacity>
      )}

      {listing.status === "awarded" &&
        listing.awardedBidId === item.id && (
          <View style={styles.awarded}>
            <Text style={styles.btnText}>✔ Awarded</Text>
          </View>
        )}

      {listing.status === "awarded" &&
        listing.awardedBidId !== item.id && (
          <View style={styles.rejected}>
            <Text style={styles.rejectedText}>
              Not Selected
            </Text>
          </View>
        )}

      {listing.status === "awarded" &&
        listing.awardedTo === item.bidBy && (
          <TouchableOpacity
            style={[
styles.completeBtn,
isCompletionPeriodOver() && { backgroundColor:"#22C55E" }
]}
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
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>
              {listing.title}
            </Text>
            <Text style={styles.meta}>
              {listing.location} • {listing.category}
            </Text>
            <Text style={styles.section}>
              Received Bids
            </Text>
          </View>
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1F3B" },
  header: { marginBottom: 20 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  meta: { color: "#C7D2E2", marginTop: 4 },
  section: {
    marginTop: 20,
    fontWeight: "700",
    color: "#D4AF37",
  },
  card: {
    backgroundColor: "#122A4D",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E3A63",
  },
  bidderName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  amount: {
    fontWeight: "700",
    color: "#D4AF37",
    marginTop: 6,
  },
  msg: { marginTop: 6, color: "#E5E7EB" },
  date: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  acceptBtn: {
    backgroundColor: "#22C55E",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  awarded: {
    backgroundColor: "#16A34A",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  rejected: {
    backgroundColor: "#1E3A63",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  rejectedText: {
    color: "#C7D2E2",
    textAlign: "center",
  },
  completeBtn: {
    backgroundColor: "#D4AF37",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  btnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
  },
  downloadBtn:{
backgroundColor:"#D4AF37",
paddingHorizontal:10,
paddingVertical:6,
borderRadius:8
},
});