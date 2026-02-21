import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp, updateDoc
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
import { auth, db, storage } from "../../../firebaseConfig";

export default function CreateListing() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [bidEndDate, setBidEndDate] = useState("");
  const [documents, setDocuments] = useState([]);
const [uploading, setUploading] = useState(false);

const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const safeFiles = [];

  for (const file of result.assets ?? []) {
    if (!file?.uri) {
      console.log("❌ Skipping invalid file:", file);
      continue;
    }

    safeFiles.push({
      name: file.name || "document",
      uri: file.uri,
      mimeType: file.mimeType || "application/octet-stream",
    });
  }

  setDocuments((prev) => [...prev, ...safeFiles]);
};


const uploadDocuments = async (listingId) => {
  if (!documents || documents.length === 0) return [];

  const uploadedDocs = [];

  for (const file of documents) {
    if (!file || !file.uri) {
      console.log("❌ Skipping invalid file:", file);
      continue;
    }

    const response = await fetch(file.uri);
    const blob = await response.blob();

    const fileRef = ref(
      storage,
      `listing-documents/${listingId}/${Date.now()}_${file.name}`
    );

    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);

    uploadedDocs.push({
      name: file.name,
      url: downloadURL,
    });
  }

  return uploadedDocs;
};
const [contractorName, setContractorName] = useState("");

useEffect(() => {
  const loadCompanyName = async () => {
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      setContractorName(snap.data().contractorName || "");
    }
  };

  loadCompanyName();
}, []);




  const handleCreate = async () => {
    if (!user) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    if (!title || !description || !category || !location || !bidEndDate) {
      Alert.alert("Error", "All fields are mandatory");
      return;
    }

    const endDate = new Date(bidEndDate);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) {
      Alert.alert("Error", "Bid end date must be a future date");
      return;
    }

    try {
  setUploading(true);

  const userSnap = await getDoc(doc(db, "users", user.uid));
const userData = userSnap.data();
const verificationLevel = userData?.verificationLevel || "basic";

  const listingRef = await addDoc(collection(db, "listings"), {
    title,
    description,
    category,
    location,
createdByVerificationLevel: verificationLevel,
    createdBy: user.uid,
    createdByCompanyName: contractorName, // ✅ IMPORTANT
  createdByRole: "contractor",
    status: "open",
    bidEndDate: Timestamp.fromDate(endDate),

    createdAt: serverTimestamp(),
    createdByRole: "contractor",
    createdByName: user.displayName || "User",

    documents: [], // temp
  });

  // ⬆️ upload documents if any
  let uploadedDocs = [];
  if (documents.length > 0) {
    uploadedDocs = await uploadDocuments(listingRef.id);
  }

  // 🔁 update listing with document URLs
  await updateDoc(listingRef, {
    documents: uploadedDocs,
  });

  Alert.alert("Success", "Listing created successfully");
  navigation.reset({
  index: 0,
  routes: [{ name: "Dashboard" }],
});


} catch (err) {
  console.log("CREATE LISTING ERROR:", err);
  Alert.alert("Error", err.message);
} finally {
  setUploading(false);
}

  };

  return (
    

    <View style={styles.container}>
      <Text style={styles.title}>Create Listing</Text>

      <TextInput style={styles.input} placeholder="Title" onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        multiline
        onChangeText={setDescription}
      />
      <TextInput style={styles.input} placeholder="Category" onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="Location" onChangeText={setLocation} />
      <TextInput
        style={styles.input}
        placeholder="Bid End Date (YYYY-MM-DD)"
        onChangeText={setBidEndDate}
      />
      <TouchableOpacity
  style={[styles.button, { backgroundColor: "#4b5563" }]}
  onPress={pickDocument}
>
  <Text style={styles.buttonText}>Upload Documents</Text>
</TouchableOpacity>

{documents.map((doc, index) => (
  <Text key={index} style={{ fontSize: 12, marginTop: 4 }}>
    📄 {doc.name}
  </Text>
))}

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Listing</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: { height: 90 },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
