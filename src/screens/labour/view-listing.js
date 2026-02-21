import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp, updateDoc, where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, storage } from "../../firebaseConfig";


export default function ViewListing() {
  const { listingId } = useLocalSearchParams();
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [listing, setListing] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
const [uploading, setUploading] = useState(false);
const [taxType, setTaxType] = useState("inclusive");



const pickDocuments = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const files = result.assets.map((file) => ({
    name: file.name,
    uri: file.uri,
    mimeType: file.mimeType,
  }));

  setDocuments((prev) => [...prev, ...files]);
};
const uploadBidDocuments = async (listingId, bidId) => {
  const uploaded = [];

  for (const file of documents) {
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const fileRef = ref(
      storage,
      `bid-documents/${listingId}/${bidId}/${Date.now()}_${file.name}`
    );

    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);

    uploaded.push({
      name: file.name,
      url,
    });
  }

  return uploaded;
};




  useEffect(() => {
    const loadListing = async () => {
      try {
        const snap = await getDoc(doc(db, "listings", listingId));
        if (!snap.exists()) {
          Alert.alert("Error", "Listing not found");
          navigation.navigate("dashboard");
          
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

const handleBid = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!amount) {
      Alert.alert("Error", "Enter bid amount");
      return;
    }

    if (!listing || !currentUser) {
      Alert.alert("Error", "Session expired. Please login again.");
      return;
    }

    console.log("AUTH UID:", currentUser.uid);

    if (listing.createdBy === currentUser.uid) {
      Alert.alert("Not allowed", "You cannot bid on your own listing");
      return;
    }

    if (listing.status !== "open") {
      Alert.alert("Closed", "Bidding is closed for this listing");
      return;
    }

    const duplicateQuery = query(
      collection(db, "bids"),
      where("listingId", "==", listing.id),
      where("bidBy", "==", currentUser.uid)
    );

    const duplicateSnap = await getDocs(duplicateQuery);

    if (!duplicateSnap.empty) {
      Alert.alert("Already Bid", "You have already placed a bid.");
      return;
    }

    setUploading(true);

    const bidRef = await addDoc(collection(db, "bids"), {
      listingId: listing.id,
      bidBy: currentUser.uid, // 🔥 MUST MATCH RULE
      bidByRole:
        listing.createdByRole === "company" ? "contractor" : "company",
      bidByName: currentUser.displayName || "User",
      amount: Number(amount),
      message,
      documents: [],
      status: "pending",
      taxType: taxType || "inclusive",
      createdAt: serverTimestamp(),
    });

    let uploadedDocs = [];
    if (documents.length > 0) {
      uploadedDocs = await uploadBidDocuments(bidRef.id);
      await updateDoc(bidRef, { documents: uploadedDocs });
    }

    await addDoc(
      collection(db, "users", listing.createdBy, "notifications"),
      {
        type: "NEW_BID",
        title: "New bid received",
        message: `A user placed a bid on "${listing.title}"`,
        isRead: false,
        createdAt: serverTimestamp(),
      }
    );

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
    <View style={styles.container}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.meta}>{listing.location} • {listing.category}</Text>

      <Text style={styles.desc}>{listing.description}</Text>
      {listing.documents && listing.documents.length > 0 && (
  <View style={{ marginTop: 20 }}>
    <Text style={styles.section}>Documents</Text>

    {listing.documents.map((doc, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => openDocument(doc.url)}
        style={{ marginTop: 6 }}
      >
        <Text style={{ color: "#2563eb" }}>
          📄 {doc.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}


      <Text style={styles.section}>Place a Bid</Text>

      <TextInput
        style={styles.input}
        placeholder="Bid Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <View style={{ marginTop: 10 }}>
  <TouchableOpacity onPress={() => setTaxType("inclusive")}>
    <Text>
      {taxType === "inclusive" ? "🔘" : "⚪"} Inclusive of Taxes
    </Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setTaxType("exclusive")}>
    <Text>
      {taxType === "exclusive" ? "🔘" : "⚪"} Exclusive of Taxes
    </Text>
  </TouchableOpacity>
</View>


      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message (optional)"
        multiline
        value={message}
        onChangeText={setMessage}
      />
<TouchableOpacity
  style={[styles.button, { backgroundColor: "#4b5563" }]}
  onPress={pickDocuments}
>
  <Text style={styles.buttonText}>Upload Documents</Text>
</TouchableOpacity>

{documents.map((doc, i) => (
  <Text key={i} style={{ fontSize: 12, marginTop: 4 }}>
    📄 {doc.name}
  </Text>
))}

      <TouchableOpacity style={styles.button} onPress={handleBid}>
        <Text style={styles.buttonText}>Submit Bid</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  meta: { marginVertical: 6, color: "#3058a9" },
  desc: { marginVertical: 10 },
  section: { marginTop: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  textArea: { height: 80 },
  button: {
    backgroundColor: "#4167d1",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});