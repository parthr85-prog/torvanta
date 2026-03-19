import Clipboard from "@react-native-clipboard/clipboard";
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
  View
} from "react-native";

import VerificationBadge from "../../components/VerificationBadge";

export default function MyBids(){

const navigation = useNavigation();
const user = auth().currentUser;

const [bids,setBids] = useState([]);
const [loading,setLoading] = useState(true);

useEffect(()=>{

if(!user) return;

const unsubscribe = firestore()
.collection("bids")
.where("bidBy","==",user.uid)
.onSnapshot(async(snapshot)=>{

try{

const results = await Promise.all(

snapshot.docs.map(async(bidDoc)=>{

const bidData = bidDoc.data();

/* FETCH LISTING */

const listingRef = firestore()
.collection("listings")
.doc(bidData.listingId);

const listingSnap = await listingRef.get();

if(!listingSnap.exists) return null;

const listingData = listingSnap.data();

/* FETCH CREATOR PROFILE */

const creatorRef = firestore()
.collection("users")
.doc(listingData.createdBy);

const creatorSnap = await creatorRef.get();

return{

id:bidDoc.id,
...bidData,
listing:listingData,
creator:creatorSnap.exists ? creatorSnap.data() : null

};

})

);

setBids(results.filter(Boolean));

}catch(e){

console.log("MY BIDS ERROR:",e);

}finally{

setLoading(false);

}

});

return ()=>unsubscribe();

},[]);

/* ---------------- COPY NUMBER ---------------- */

const copyNumber = async(number)=>{
await Clipboard.setString(number);
alert("Contact number copied");
};

/* ---------------- STATUS ---------------- */

const getStatus = (item) => {

  if (item.status === "withdrawn") {
    return { text: "Withdrawn", color: "#9CA3AF" };
  }

  if (item.listing.awardedBidId === item.id) {

    if (item.listing.status === "completed") {
      return { text: "Project Completed ✅", color: "#22C55E" };
    }

    return { text: "You Won 🎉", color: "#22C55E" };
  }

  if (item.status === "rejected") {
    return { text: "Not Selected", color: "#EF4444" };
  }

  return { text: "Pending", color: "#D4AF37" };
};

/* ---------------- DATE FORMAT ---------------- */

const formatDate = (ts)=>{
if(!ts?.toDate) return "-";
return ts.toDate().toDateString();
};

/*----------WITHDRAW BID---------------------- */
const withdrawBid = async (bidId) => {
  try {

    await firestore()
      .collection("bids")
      .doc(bidId)
      .update({
        status: "withdrawn",
        withdrawnAt: firestore.FieldValue.serverTimestamp()
      });

  } catch (e) {
    console.log("WITHDRAW BID ERROR:", e);
  }
};

const confirmWithdraw = (bidId) => {

  Alert.alert(
    "Withdraw Bid",
    "Are you sure you want to withdraw this bid?",
    [
      { text: "No", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: () => withdrawBid(bidId)
      }
    ]
  );

};

/* ---------------- UI ---------------- */

return(

<View style={styles.container}>

{loading ? (

<Text style={styles.loading}>Loading bids...</Text>

):( 

<FlatList
data={bids}
keyExtractor={(item)=>item.id}
contentContainerStyle={{ padding:16,paddingBottom:40 }}
renderItem={({item})=>{

const status = getStatus(item);

const isWinner =
item.listing.awardedBidId === item.id &&
item.listing.status !== "open";


return(

<View style={styles.card}>

<Text style={styles.amount}>₹ {item.amount} {styles.taxtype} {item.taxType} GST </Text>

{/* CREATOR NAME */}

<TouchableOpacity
onPress={()=>navigation.navigate(
"ViewUserProfile",
{ userId:item.listing.createdBy }
)}
>
<Text style={styles.creator}>
{item.listing.createdByCompanyName}
</Text>
</TouchableOpacity>

<VerificationBadge
level={item.creator?.verificationLevel || "basic"}
/>

<Text style={styles.title}>
{item.listing.title}
</Text>

<Text style={styles.meta}>
{item.listing.category} • {item.listing.subCategory}
</Text>

<Text style={styles.meta}>
Work Type: {item.listing.workType}
</Text>

<Text style={styles.meta}>
Contract Type: {item.listing.contractType}
</Text>

<Text style={styles.meta}>
Bid End: {formatDate(item.listing.bidEndDate)}
</Text>

<Text style={styles.meta}>
Bid Submitted: {formatDate(item.createdAt)}
</Text>

<Text style={[styles.status,{color:status.color}]}>
{status.text}
</Text>

{/* BID DOCUMENTS */}

{item.documents?.length > 0 && (

<View style={{marginTop:10}}>

<Text style={styles.docTitle}>
Uploaded Documents
</Text>

{item.documents.map((doc,i)=>(

<Text key={i} style={styles.doc}>
📄 {doc.name}
</Text>

))}

</View>

)}

{item.status !== "withdrawn" && item.listing.status === "open" && (
  <TouchableOpacity
    style={styles.withdrawBtn}
    onPress={() => confirmWithdraw(item.id)}
  >
    <Text style={styles.withdrawText}>Withdraw Bid</Text>
  </TouchableOpacity>
)}

{/* CONTACT NUMBER */}

{isWinner && item.listing.contactNumber && (

<View style={{ marginTop:15 }}>

<Text style={{ color:"#22C55E",fontWeight:"700" }}>
Contact Number:
</Text>

<Text style={{ color:"#FFFFFF",marginTop:4 }}>
{item.listing.contactNumber}
</Text>

<TouchableOpacity
onPress={()=>copyNumber(item.listing.contactNumber)}
style={{
marginTop:8,
backgroundColor:"#1E3A63",
padding:8,
borderRadius:8,
alignSelf:"flex-start"
}}
>

<Text style={{ color:"#D4AF37",fontWeight:"600" }}>
Copy
</Text>

</TouchableOpacity>

</View>

)}

</View>

);

}}

 />

)}

</View>

);

}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#0B1F3B"
},

loading:{
textAlign:"center",
marginTop:40,
fontSize:16,
color:"#C7D2E2"
},

card:{
backgroundColor:"#122A4D",
padding:18,
borderRadius:18,
marginBottom:16,
borderWidth:1,
borderColor:"#1E3A63"
},

amount:{
fontSize:20,
fontWeight:"700",
color:"#D4AF37"
},

creator:{
marginTop:6,
fontWeight:"700",
fontSize:16,
color:"#D4AF37"
},

title:{
marginTop:6,
fontSize:16,
fontWeight:"700",
color:"#D4AF37"
},

meta:{
marginTop:4,
color:"#C7D2E2"
},

status:{
marginTop:10,
fontWeight:"700"
},

docTitle:{
color:"#22C55E",
fontWeight:"700"
},

withdrawBtn:{
marginTop:12,
backgroundColor:"#EF4444",
paddingVertical:8,
paddingHorizontal:14,
borderRadius:10,
alignSelf:"flex-start"
},

withdrawText:{
color:"#FFFFFF",
fontWeight:"700"
},

doc:{
color:"#FFFFFF",
marginTop:4
}

});