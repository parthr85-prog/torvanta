import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
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

  const [bidEndDate, setBidEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState("");

  /* ---------------- LOAD COMPANY NAME ---------------- */
  useEffect(() => {
    const loadCompanyName = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setCompanyName(snap.data().companyName || "");
      }
    };
    loadCompanyName();
  }, []);

  /* ---------------- FORMAT DATE (DD-MM-YYYY) ---------------- */
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBidEndDate(selectedDate);
    }
  };

  /* ---------------- DOCUMENT PICKER ---------------- */
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const safeFiles = result.assets
      ?.filter((file) => file?.uri)
      .map((file) => ({
        name: file.name || "document",
        uri: file.uri,
      }));

    setDocuments((prev) => [...prev, ...safeFiles]);
  };

  const uploadDocuments = async (listingId) => {
    if (!documents.length) return [];

    const uploadedDocs = [];

    for (const file of documents) {
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

  /* ---------------- HANDLE CREATE ---------------- */
  const handleCreate = async () => {
    if (!user) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    if (!title || !description || !category || !location || !bidEndDate) {
      Alert.alert("Error", "All fields are mandatory");
      return;
    }

    if (bidEndDate <= new Date()) {
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
        createdByCompanyName: companyName,
        createdByRole: "company",
        status: "open",
        bidEndDate: Timestamp.fromDate(bidEndDate),
        createdAt: serverTimestamp(),
        createdByName: user.displayName || "User",
        documents: [],
      });

      let uploadedDocs = [];
      if (documents.length > 0) {
        uploadedDocs = await uploadDocuments(listingRef.id);
      }

      await updateDoc(listingRef, {
        documents: uploadedDocs,
      });

      Alert.alert("Success", "Listing created successfully");

      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Listing</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#999"
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        placeholderTextColor="#999"
        multiline
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Category"
        placeholderTextColor="#999"
        onChangeText={setCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        placeholderTextColor="#999"
        onChangeText={setLocation}
      />

      {/* DATE PICKER */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>
          {bidEndDate ? formatDate(bidEndDate) : "Select Bid End Date"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={bidEndDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      {/* UPLOAD BUTTON */}
      <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
        <Text style={styles.uploadText}>Upload Documents</Text>
      </TouchableOpacity>

      {documents.map((doc, index) => (
        <Text key={index} style={styles.fileText}>
          📄 {doc.name}
        </Text>
      ))}

      {/* CREATE BUTTON */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createText}>
          {uploading ? "Creating..." : "Create Listing"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- TORVANTA THEME ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0B1C2D",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#CFAF5E",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
  },
  dateText: {
    color: "#000",
  },
  uploadButton: {
    backgroundColor: "#1E2F45",
    padding: 14,
    borderRadius: 10,
  },
  uploadText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#CFAF5E",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  createText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  fileText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 5,
  },
});