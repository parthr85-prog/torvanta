import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import VerificationBadge from "../../components/VerificationBadge";

export default function ViewListing() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listingId } = route.params;

  const user = auth().currentUser;

  const [listing, setListing] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [downloadProgress,setDownloadProgress] = useState({});
const [downloading,setDownloading] = useState({});
const [uploadProgress,setUploadProgress] = useState({});
  const [taxType, setTaxType] = useState("inclusive");

  useEffect(() => {
    const loadListing = async () => {
      try {
        const snap = await firestore()
          .collection("listings")
          .doc(listingId)
          .get();

        if (!snap.exists) {
          Alert.alert("Error", "Listing not found");
          navigation.goBack();
          return;
        }

        setListing({ id: snap.id, ...snap.data() });
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, []);

  const pickDocuments = async()=>{

const result = await DocumentPicker.getDocumentAsync({

type:[

/* PDF */
"application/pdf",

/* Images */
"image/jpeg",
"image/png",

/* Word */
"application/msword",
"application/vnd.openxmlformats-officedocument.wordprocessingml.document",

/* Excel */
"application/vnd.ms-excel",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

],

multiple:true,
copyToCacheDirectory:true

});

if(result.canceled) return;

const files = result.assets.map(file=>({
name:file.name,
uri:file.uri
}));

setDocuments(prev=>[...prev,...files]);

};

const downloadDocument = async(doc)=>{

try{

const safeTitle =
listing.title.replace(/[\/:*?"<>|]/g,"");

const folderName =
safeTitle + "-" + listing.id;

const root =
FileSystem.documentDirectory +
"Torvanta/" +
auth().currentUser.uid +
"/";

const listingFolder =
root + folderName + "/";

await FileSystem.makeDirectoryAsync(
listingFolder,
{ intermediates:true }
);

const fileName = doc.name;

const filePath =
listingFolder + fileName;

/* DOWNLOAD */

const downloadResumable =
FileSystem.createDownloadResumable(
doc.url,
filePath,
{},
(progress)=>{

const percent =
progress.totalBytesWritten /
progress.totalBytesExpectedToWrite * 100;

setDownloadProgress(prev=>({
...prev,
[fileName]:Math.floor(percent)
}));

setDownloading(prev=>({
...prev,
[fileName]:true
}));

}
);

await downloadResumable.downloadAsync();

setDownloading(prev=>({
...prev,
[fileName]:false
}));

/* SAVE META */

const metaFile =
listingFolder + "meta.json";

const metaInfo =
await FileSystem.getInfoAsync(metaFile);

if(!metaInfo.exists){

await FileSystem.writeAsStringAsync(
metaFile,
JSON.stringify({
listingId:listing.id,
title:listing.title,
expiryDate:
listing.bidEndDate?.toDate?.() ||
listing.bidEndDate
})
);

}

/* UPDATE DOWNLOAD INDEX */

/* UPDATE DOWNLOAD INDEX */

const indexFolder =
FileSystem.documentDirectory +
"Torvanta/" +
user.uid +
"/";

await FileSystem.makeDirectoryAsync(
indexFolder,
{ intermediates:true }
);

const indexFile =
indexFolder + "downloadIndex.json";

let index = [];

const indexInfo =
await FileSystem.getInfoAsync(indexFile);

if(indexInfo.exists){

index = JSON.parse(
await FileSystem.readAsStringAsync(indexFile)
);

}

if(!index.find(i =>
i.folderName === folderName &&
i.fileName === fileName
)){

index.push({

folderName,
fileName,
expiryDate:
listing.bidEndDate?.toDate?.() ||
listing.bidEndDate

});

}

await FileSystem.writeAsStringAsync(
indexFile,
JSON.stringify(index,null,2)
);

Alert.alert("Downloaded","File saved to My Downloads");

}catch(e){

console.log("DOWNLOAD ERROR",e);
Alert.alert("Download failed");

}

};

  const uploadBidDocuments = async (bidId) => {
    const uploaded = [];

    for (const file of documents) {
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const fileRef = storage().ref(
        `bid-documents/${listingId}/${bidId}/${Date.now()}_${file.name}`
      );

      const task = fileRef.put(blob);

await new Promise((resolve,reject)=>{

task.on(
"state_changed",

(snapshot)=>{

const percent =
(snapshot.bytesTransferred /
snapshot.totalBytes) * 100;

setUploadProgress(prev=>({
...prev,
[file.name]:Math.floor(percent)
}));

},

reject,

async ()=>{

const url = await fileRef.getDownloadURL();

uploaded.push({
name:file.name,
url
});

resolve();

}

);

});
      const url = await fileRef.getDownloadURL();
    }

    return uploaded;
  };

  const removeLocalDocument = (index)=>{
setDocuments(prev=>prev.filter((_,i)=>i!==index));
};

  const handleBid = async () => {
    try {
      const currentUser = auth().currentUser;

      if (!amount) {
        Alert.alert("Error", "Enter bid amount");
        return;
      }

      if (!listing || !currentUser) {
        Alert.alert("Error", "Session expired.");
        return;
      }

      if (listing.createdBy === currentUser.uid) {
        Alert.alert("Not allowed", "You cannot bid on your own listing");
        return;
      }

      if (listing.status !== "open") {
        Alert.alert("Closed", "Bidding is closed for this listing");
        return;
      }

      const duplicateSnap = await firestore()
        .collection("bids")
        .where("listingId", "==", listing.id)
        .where("bidBy", "==", currentUser.uid)
        .get();

      if (!duplicateSnap.empty) {
        Alert.alert("Already Bid", "You have already placed a bid.");
        return;
      }

      setUploading(true);

      // ✅ FIX: Get actual user role from users collection
      const userSnap = await firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();

      const userData = userSnap.data();
      const actualRole = userData?.role || "labour";

      let nm; {
        if ( actualRole == "company" ) {
          nm = userData.companyName}
          else {nm = userData.name}
      }

      const bidRef = await firestore()
        .collection("bids")
        .add({
          listingId: listing.id,
          bidBy: currentUser.uid,
          bidByRole: actualRole, // ✅ fixed here
          bidByName: nm || "User",
          amount: Number(amount),
          message,
          documents: [],
          status: "pending",
          taxType: taxType || "inclusive",
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      let uploadedDocs = [];
      if (documents.length > 0) {
        uploadedDocs = await uploadBidDocuments(bidRef.id);

        await bidRef.update({
          documents: uploadedDocs,
        });
      }

      await firestore()
        .collection("users")
        .doc(listing.createdBy)
        .collection("notifications")
        .add({
          type: "NEW_BID",
          title: "New bid received",
          message: `A user placed a bid on "${listing.title}"`,
          isRead: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert("Success", "Bid submitted successfully");
      navigation.goBack();
    } catch (e) {
      console.log("BID ERROR:", e);
      Alert.alert("Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !listing) return null;

  const openDocument = async (url) => {
    await Linking.openURL(url);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{listing.title}</Text>

      <VerificationBadge
        level={listing.createdByVerificationLevel}
      />

      <Text style={styles.creator}>
 {listing.createdByCompanyName}
</Text>



     {/*} <Text style={styles.meta}>
{item.category} • {item.subCategory}
</Text>*/}

<Text style={styles.meta}>
📍 {listing.district}, {listing.state}
</Text>

<Text style={styles.meta}>
⏳ Completion: {listing.workCompletionDays || "-"} days
</Text>

{/* SITE VISIT DETAILS */}

{(listing.siteVisitFromDate || listing.siteVisitTiming) && (

<View style={{marginTop:10}}>

<Text style={styles.section}>
Site Visit Details
</Text>

{listing.siteVisitFromDate && (
<Text style={styles.meta}>
Visit From: {listing.siteVisitFromDate?.toDate()?.toDateString()}
</Text>
)}

{listing.siteVisitToDate && (
<Text style={styles.meta}>
Visit To: {listing.siteVisitToDate?.toDate()?.toDateString()}
</Text>
)}

{listing.siteVisitTiming && (
<Text style={styles.meta}>
Visit Timing: {listing.siteVisitTiming}
</Text>
)}

{listing.siteContactNumber && (
<Text style={styles.meta}>
Site Contact: {listing.siteContactNumber}
</Text>
)}

</View>

)}

<Text style={styles.meta}>
📅 Bid Ends: {listing.bidEndDate?.toDate()?.toDateString()}
</Text>

<Text style={styles.meta}>
⏳ Work Type: {listing.workType || "-"} 
</Text>

<Text style={styles.meta}>
⏳ Contract Type: {listing.contractType || "-"} 
</Text>

      <Text style={styles.desc}>
        {listing.description}
      </Text>

      {listing.documents?.length > 0 && (
        <View style={styles.docSection}>
          <Text style={styles.section}>
            Documents
          </Text>

         {listing.documents.map((doc,index)=>(

<View key={index} style={{marginTop:6}}>

<View style={{flexDirection:"row",justifyContent:"space-between"}}>

<Text style={styles.docText}>
📄 {doc.name}
</Text>

<TouchableOpacity
style={styles.downloadBtn}
onPress={()=>downloadDocument(doc)}
>
<Text style={{color:"#0B1F3B",fontWeight:"700"}}>
Download
</Text>
</TouchableOpacity>

</View>

{downloading[doc.name] && (

<Text style={{color:"#22C55E",fontSize:12}}>
Downloading {downloadProgress[doc.name] || 0}%
</Text>

)}

</View>

))}
        </View>
      )}

      <Text style={styles.section}>
        Place a Bid
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Bid Amount"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.taxContainer}>
        <TouchableOpacity
          style={[
            styles.taxBtn,
            taxType === "inclusive" &&
              styles.taxActive,
          ]}
          onPress={() =>
            setTaxType("inclusive")
          }
        >
          <Text style={styles.taxText}>
            Inclusive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.taxBtn,
            taxType === "exclusive" &&
              styles.taxActive,
          ]}
          onPress={() =>
            setTaxType("exclusive")
          }
        >
          <Text style={styles.taxText}>
            Exclusive
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message (optional)"
        placeholderTextColor="#9CA3AF"
        multiline
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={pickDocuments}
      >
        <Text style={styles.uploadText}>
          Upload Documents
        </Text>
      </TouchableOpacity>

      {documents.map((doc,index)=>(

<View key={index} style={{flexDirection:"row",alignItems:"center",marginTop:6}}>

<View style={{flex:1}}>

<Text style={styles.fileText}>
📄 {doc.name}
</Text>

{uploadProgress[doc.name] !== undefined && (

<Text style={{color:"#22C55E",fontSize:12}}>
Uploading {uploadProgress[doc.name]}%
</Text>

)}

</View>

<TouchableOpacity
onPress={()=>removeLocalDocument(index)}
style={styles.deleteButton}
>
<Text style={{color:"#fff",fontWeight:"700"}}>
✕
</Text>
</TouchableOpacity>

</View>

))}

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleBid}
      >
        <Text style={styles.submitText}>
          {uploading
            ? "Submitting..."
            : "Submit Bid"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0B1F3B",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
   creator: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D4AF37",
    marginBottom: 10,
  },
  meta: {
    marginVertical: 6,
    color: "#E5E7EB",
  },
  desc: {
    marginVertical: 10,
    color: "#E5E7EB",
  },
  section: {
    marginTop: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#122A4D",
    borderWidth: 1,
    borderColor: "#1E3A63",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    color: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  taxContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  taxBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#122A4D",
    borderWidth: 1,
    borderColor: "#1E3A63",
    alignItems: "center",
  },
  taxActive: {
    backgroundColor: "#D4AF37",
  },
  taxText: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
  uploadBtn: {
    backgroundColor: "#1E3A63",
    padding: 14,
    borderRadius: 14,
    marginTop: 15,
  },
  uploadText: {
    color: "#D4AF37",
    fontWeight: "700",
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  submitText: {
    color: "#0B1F3B",
    fontWeight: "700",
    textAlign: "center",
  },
  docSection: {
    marginTop: 10,
  },
  docBtn: {
    backgroundColor: "#122A4D",
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  docText: {
    color: "#D4AF37",
    fontWeight: "600",
  },
  downloadBtn:{
backgroundColor:"#D4AF37",
paddingVertical:3,
paddingHorizontal:5,
borderRadius:8,
},
  fileText: {
    fontSize: 12,
    marginTop: 6,
    color: "#C7D2E2",
  },
});