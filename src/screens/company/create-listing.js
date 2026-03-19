import DateTimePicker from "@react-native-community/datetimepicker";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";


export default function CreateListing() {

const navigation = useNavigation();
const user = auth().currentUser;

/* ---------------- BASIC FIELDS ---------------- */

const [title,setTitle] = useState("");
const [description,setDescription] = useState("");

/* ---------------- CATEGORY ---------------- */

const [category,setCategory] = useState("");
const [subCategory,setSubCategory] = useState("");
const [subCategoryOptions,setSubCategoryOptions] = useState([]);

const [categoryOpen,setCategoryOpen] = useState(false);
const [subCategoryOpen,setSubCategoryOpen] = useState(false);

const [addSubCategory,setAddSubCategory] = useState(false);
const [customSubCategory,setCustomSubCategory] = useState("");

/*--------------------firebase category-------*/

const [categories,setCategories] = useState([]);
const [newCategory,setNewCategory] = useState("");
const [newSubCategory,setNewSubCategory] = useState("");

/* ---------------- WORK TYPE ---------------- */

const [workType,setWorkType] = useState("");
const [workTypeOpen,setWorkTypeOpen] = useState(false);

/* ---------------- CONTRACT TYPE ---------------- */

const [contractType,setContractType] = useState("");
const [contractTypeOpen,setContractTypeOpen] = useState(false);

/* ---------------- VALUE ---------------- */

const [estimatedValue,setEstimatedValue] = useState("");
const [valueOpen,setValueOpen] = useState(false);

/* ---------------- URGENT ---------------- */

const [urgent,setUrgent] = useState(false);

/* ---------------- CONTACT ---------------- */

const [contactNumber,setContactNumber] = useState("");
/* ---------------- SITE VISIT ---------------- */

const [siteVisitFromDate,setSiteVisitFromDate] = useState(null);
const [siteVisitToDate,setSiteVisitToDate] = useState(null);
const [showVisitFromPicker,setShowVisitFromPicker] = useState(false);
const [showVisitToPicker,setShowVisitToPicker] = useState(false);

const [siteVisitTiming,setSiteVisitTiming] = useState("");
const [siteContactNumber,setSiteContactNumber] = useState("");

/* ---------------- LOCATION ---------------- */

const [pincode,setPincode] = useState("");
const [district,setDistrict] = useState("");
const [subDistrict,setSubDistrict] = useState("");
const [stateName,setStateName] = useState("");
const [exactLocation,setExactLocation] = useState("");

/* ---------------- DATE ---------------- */

const [bidEndDate,setBidEndDate] = useState(null);
const [showDatePicker,setShowDatePicker] = useState(false);

/* ---------------- DOCUMENTS ---------------- */

const [documents,setDocuments] = useState([]);
const [uploading,setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState({});

const [companyName,setCompanyName] = useState("");

const [workCompletionDays,setWorkCompletionDays] = useState("");

const removeLocalDocument = (index) => {
  setDocuments((prev) => prev.filter((_, i) => i !== index));
};

/*-------------- CURRENCY FORMATTER ---------------*/

const formatIndianCurrency = (value) => {

if (!value) return "";

const x = value.toString();

let lastThree = x.substring(x.length - 3);
let otherNumbers = x.substring(0, x.length - 3);

if (otherNumbers !== "")
lastThree = "," + lastThree;

return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

};

/* ---------------- LOAD COMPANY ---------------- */

useEffect(()=>{

const loadCompanyName = async ()=>{

if(!user) return;

const snap = await firestore()
.collection("users")
.doc(user.uid)
.get();

if(snap.exists){
setCompanyName(snap.data().companyName || "");
}

};

loadCompanyName();

},[]);

/* ---------------- CATEGORY SELECT ---------------- */

const selectCategory = (value)=>{

setCategory(value);

const selected = categories.find(c=>c.name === value);

setSubCategoryOptions(selected?.subCategories || []);

setSubCategory("");

setCategoryOpen(false);

};

/*-------------------firestore category----------------*/

useEffect(()=>{

const unsubscribe = firestore()
.collection("listingCategories")
.onSnapshot(snap=>{

const list = snap.docs.map(doc=>({
id:doc.id,
...doc.data()
}))
setCategories(list);

});

return ()=>unsubscribe();

},[]);

/* ---------------- PINCODE LOOKUP ---------------- */

const fetchLocationFromPincode = async(pin)=>{

if(pin.length !== 6) return;

try{

const res = await fetch(
`https://api.postalpincode.in/pincode/${pin}`
);

const data = await res.json();

if(data[0].Status === "Success"){

const post = data[0].PostOffice[0];

setDistrict(post.District || "");
setSubDistrict(post.Block || "");
setStateName(post.State || "");

}else{

Alert.alert("Invalid PIN Code");

}

}catch{

Alert.alert("PIN lookup failed");

}

};

/* ---------------- MOBILE VALIDATION ---------------- */

const validateMobile = ()=>{

const regex = /^[6-9]\d{9}$/;

return regex.test(contactNumber);

};

/* ---------------- PICK DOCUMENT ---------------- */

const pickDocuments = async () => {

const result = await DocumentPicker.getDocumentAsync({

type: [
"application/pdf",

"image/jpeg",
"image/png",

"application/msword",
"application/vnd.openxmlformats-officedocument.wordprocessingml.document",

"application/vnd.ms-excel",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
],

multiple: true,
copyToCacheDirectory: true

});

if (result.canceled) return;

const files = result.assets.map(file => ({
name: file.name,
uri: file.uri,
type: file.mimeType
}));

if(documents.length + files.length > 5){
Alert.alert("Maximum 5 documents allowed");
return;
}

setDocuments(prev => [...prev, ...files]);

};

/* ---------------- UPLOAD DOCUMENTS ---------------- */

const uploadDocuments = async (listingId) => {

if (!documents.length) return [];



const uploadedDocs = [];

for (const file of documents) {

try {

console.log("Uploading:", file.uri);

const reference = storage().ref(
`listing-documents/${user.uid}/${listingId}/${Date.now()}_${file.name}`
);

const task = reference.putFile(file.uri);

/* TRACK UPLOAD PROGRESS */

await new Promise((resolve, reject) => {

task.on(
"state_changed",

(snapshot) => {

const progress =
(snapshot.bytesTransferred / snapshot.totalBytes) * 100;

setUploadProgress(prev => ({
...prev,
[file.name]: Math.floor(progress)
}));

},

(error) => {
console.log("UPLOAD ERROR:", error);
reject(error);
},

async () => {

const downloadURL = await reference.getDownloadURL();

uploadedDocs.push({
name: file.name,
url: downloadURL
});

resolve();

}

);

});

} catch (err) {

console.log("UPLOAD ERROR:", err);

}

}

return uploadedDocs;

};

/* -----------------DELETE DOCUMENT --------------*/

const deleteDocument = async (doc, listingId) => {
  try {

    // delete from Firebase Storage
    const fileRef = storage().refFromURL(doc.url);
    await fileRef.delete();

    // remove from Firestore document array
    await firestore()
      .collection("listings")
      .doc(listingId)
      .update({
        documents: firestore.FieldValue.arrayRemove(doc)
      });

    // remove from local state
    setDocuments((prev) =>
      prev.filter((item) => item.url !== doc.url)
    );

    Alert.alert("File removed");

  } catch (err) {

    console.log("DELETE ERROR:", err);
    Alert.alert("Failed to delete file");

  }
};

/* ---------------- DATE FORMAT ---------------- */

const formatDate = (date)=>{

const d = String(date.getDate()).padStart(2,"0");
const m = String(date.getMonth()+1).padStart(2,"0");
const y = date.getFullYear();

return `${d}-${m}-${y}`;

};

/* ---------------- CREATE LISTING ---------------- */

const handleCreate = async ()=>{

  if(!user){
Alert.alert("Session expired");
return;
}

if(
!title ||
!description ||
!category ||
!workType ||
!contractType ||
!estimatedValue ||
!pincode ||
!contactNumber ||
!workCompletionDays ||
!bidEndDate ||
(category !== "custom" && !subCategory && !customSubCategory) ||
(category === "custom" && (!newCategory || !newSubCategory))
)
{

Alert.alert("Error","All fields required");

return;

}

if(!validateMobile()){

Alert.alert("Invalid Mobile Number");

return;

}

try{

setUploading(true);

const userSnap = await firestore()
.collection("users")
.doc(user.uid)
.get();

const verificationLevel =
userSnap.data()?.verificationLevel || "basic";

let finalCategory = category;
let finalSubCategory = subCategory;


if(category === "custom"){

if(newCategory.length < 3){
Alert.alert("Category too short");
return;
}

finalCategory = newCategory.trim();
finalSubCategory = newSubCategory.trim();

if(finalCategory.length > 50){
Alert.alert("Category too long");
return;
}

const categoryRef = firestore()
.collection("listingCategories")
.doc(finalCategory.toLowerCase());

await categoryRef.set({
name: finalCategory,
subCategories: firestore.FieldValue.arrayUnion(finalSubCategory)
},{ merge:true });

}

if(category !== "custom" && customSubCategory){

finalSubCategory = customSubCategory.trim();

const categoryRef = firestore()
.collection("listingCategories")
.doc(category.toLowerCase());

await categoryRef.set({
subCategories: firestore.FieldValue.arrayUnion(finalSubCategory)
},{ merge:true });

}

const listingRef = await firestore()
.collection("listings")
.add({

title,
description,

category:finalCategory,
subCategory:finalSubCategory,

workType,
contractType,
estimatedValue: Number(estimatedValue),
workCompletionDays: Number(workCompletionDays),
pincode,
district,
subDistrict,
state:stateName,
exactLocation,

contactNumber,
urgent,

createdBy:user.uid,
createdByCompanyName:companyName,
createdByRole:"company",
verificationLevel,

status:"open",

bidEndDate:firestore.Timestamp.fromDate(bidEndDate),

createdAt:firestore.FieldValue.serverTimestamp(),

siteVisitFromDate: siteVisitFromDate
? firestore.Timestamp.fromDate(siteVisitFromDate)
: null,

siteVisitToDate: siteVisitToDate
? firestore.Timestamp.fromDate(siteVisitToDate)
: null,

siteVisitTiming,
siteContactNumber,

documents:[]

});

const uploadedDocs = await uploadDocuments(listingRef.id);


await firestore()
.collection("listings")
.doc(listingRef.id)
.update({
documents: uploadedDocs
});



Alert.alert("Success","Listing created");

navigation.reset({
index:0,
routes:[{name:"Dashboard"}]
});

}catch(err){

Alert.alert("Error",err.message);

}finally{

setUploading(false);

}

};

/* ---------------- UI ---------------- */

return(

<ScrollView
style={{flex:1,backgroundColor:"#0B1F3B"}}
contentContainerStyle={styles.container}
>

<Text style={styles.title}>Create Listing</Text>

<View style={styles.card}>

{/* URGENT TOGGLE */}

<View style={styles.toggleRow}>

<Text style={styles.label}>Tap if Urgent</Text>

<TouchableOpacity
style={[
styles.toggle,
urgent && styles.toggleActive
]}
onPress={()=>setUrgent(!urgent)}
/>

</View>

<TextInput
style={styles.input}
placeholder="Title"
placeholderTextColor="#8FA3BF"
onChangeText={setTitle}
/>

<TextInput
style={[styles.input,styles.textArea]}
placeholder="Description"
placeholderTextColor="#8FA3BF"
multiline
onChangeText={setDescription}
/>

{/* CATEGORY */}

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setCategoryOpen(!categoryOpen)}
>
<Text style={styles.dropdownText}>
{category || "Select Category"}
</Text>

</TouchableOpacity>

{categoryOpen && (
<>
{categories.map(item=>(
<TouchableOpacity
key={item.name}
style={styles.dropdownItem}
onPress={()=>selectCategory(item.name)}
>
<Text style={styles.option}>{item.name}</Text>
</TouchableOpacity>
))}

<TouchableOpacity
style={styles.dropdownItem}
onPress={()=>{
setCategory("custom");
setSubCategory("");
setSubCategoryOptions([]);
setCategoryOpen(false);
}}
>
<Text style={styles.option}>+ Add New Category</Text>
</TouchableOpacity>

</>
)}

{category === "custom" && (

<>
<TextInput
style={styles.input}
placeholder="Enter New Category"
placeholderTextColor="#8FA3BF"
value={newCategory}
onChangeText={setNewCategory}
/>

<TextInput
style={styles.input}
placeholder="Enter Sub Category"
placeholderTextColor="#8FA3BF"
value={newSubCategory}
onChangeText={setNewSubCategory}
/>
</>

)}

{/* SUBCATEGORY */}

{/* SUBCATEGORY */}

{category !== "" && category !== "custom" && (

<>

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setSubCategoryOpen(!subCategoryOpen)}
>
<Text style={styles.dropdownText}>
{subCategory || "Select Sub Category"}
</Text>
</TouchableOpacity>

{subCategoryOpen && (
<>

{subCategoryOptions.map(item=>(
<TouchableOpacity
key={item}
style={styles.dropdownItem}
onPress={()=>{
setSubCategory(item);
setAddSubCategory(false);
setSubCategoryOpen(false);
}}
>
<Text style={styles.option}>{item}</Text>
</TouchableOpacity>
))}

<TouchableOpacity
style={styles.dropdownItem}
onPress={()=>{
setAddSubCategory(true);
setSubCategoryOpen(false);
}}
>
<Text style={styles.option}>+ Add New Sub Category</Text>
</TouchableOpacity>

</>
)}

{addSubCategory && (
<TextInput
style={styles.input}
placeholder="Enter New Sub Category"
placeholderTextColor="#8FA3BF"
value={customSubCategory}
onChangeText={setCustomSubCategory}
/>
)}

</>

)}

{/* WORK TYPE */}

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setWorkTypeOpen(!workTypeOpen)}
>
<Text style={styles.dropdownText}>
{workType || "Work Type"}
</Text>
</TouchableOpacity>

{workTypeOpen && ["labour","labour_material"].map(v=>(
<TouchableOpacity
key={v}
style={styles.dropdownItem}
onPress={()=>{setWorkType(v);setWorkTypeOpen(false);}}
>
<Text style={styles.option}>
{v === "labour" ? "Only Labour" : "Labour + Material"}
</Text>
</TouchableOpacity>
))}

{/* CONTRACT TYPE */}

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setContractTypeOpen(!contractTypeOpen)}
>
<Text style={styles.dropdownText}>
{contractType || "Contract Type"}
</Text>
</TouchableOpacity>

{contractTypeOpen && ["item_rate","back_to_back","lump_sum"].map(v=>(
<TouchableOpacity
key={v}
style={styles.dropdownItem}
onPress={()=>{setContractType(v);setContractTypeOpen(false);}}
>
<Text style={styles.option}>{v.replace("_"," ")}</Text>
</TouchableOpacity>
))}

{/* VALUE */}

<TextInput
style={styles.input}
placeholder="Estimated Project Value (₹)"
placeholderTextColor="#8FA3BF"
keyboardType="numeric"
value={formatIndianCurrency(estimatedValue)}
onChangeText={(text) => {
const cleanValue = text.replace(/,/g, "");
setEstimatedValue(cleanValue);
}}
/>

{/* WORK COMPLETION PERIOD */}

<TextInput
style={styles.input}
placeholder="Work Completion Period (Days)"
placeholderTextColor="#8FA3BF"
keyboardType="numeric"
value={workCompletionDays}
onChangeText={setWorkCompletionDays}
/>

{/* PIN */}

<TextInput
style={styles.input}
placeholder="PIN Code"
keyboardType="numeric"
maxLength={6}
value={pincode}
onChangeText={(text)=>{
setPincode(text);
if(text.length === 6) fetchLocationFromPincode(text);
}}
/>

<TextInput style={styles.input} value={subDistrict} editable={false}/>
<TextInput style={styles.input} value={district} editable={false}/>
<TextInput style={styles.input} value={stateName} editable={false}/>

<TextInput
style={styles.input}
placeholder="Exact Work Location"
placeholderTextColor="#8FA3BF"
value={exactLocation}
onChangeText={setExactLocation}
/>

<TextInput
style={styles.input}
placeholder="Contact Number"
placeholderTextColor="#8FA3BF"
keyboardType="phone-pad"
value={contactNumber}
onChangeText={setContactNumber}
/>

{/* SITE VISIT SECTION */}

<Text style={styles.label}>Site Visit Details</Text>

<TouchableOpacity
style={styles.dateButton}
onPress={()=>setShowVisitFromPicker(true)}
>
<Text style={styles.dateText}>
{siteVisitFromDate ? formatDate(siteVisitFromDate) : "Visit From Date"}
</Text>
</TouchableOpacity>

{showVisitFromPicker && (

<DateTimePicker
value={siteVisitFromDate || new Date()}
mode="date"
minimumDate={new Date()}
onChange={(e,d)=>{
setShowVisitFromPicker(false);
if(d) setSiteVisitFromDate(d);
}}
/>

)}

<TouchableOpacity
style={styles.dateButton}
onPress={()=>setShowVisitToPicker(true)}
>
<Text style={styles.dateText}>
{siteVisitToDate ? formatDate(siteVisitToDate) : "Visit To Date"}
</Text>
</TouchableOpacity>

{showVisitToPicker && (

<DateTimePicker
value={siteVisitToDate || new Date()}
mode="date"
minimumDate={siteVisitFromDate || new Date()}
onChange={(e,d)=>{
setShowVisitToPicker(false);
if(d) setSiteVisitToDate(d);
}}
/>

)}

<TextInput
style={styles.input}
placeholder="Visit Timings (Example: 10 AM - 5 PM)"
placeholderTextColor="#8FA3BF"
value={siteVisitTiming}
onChangeText={setSiteVisitTiming}
/>

<TextInput
style={styles.input}
placeholder="Site Contact Number"
placeholderTextColor="#8FA3BF"
keyboardType="phone-pad"
value={siteContactNumber}
onChangeText={setSiteContactNumber}
/>

<TouchableOpacity
style={styles.dateButton}
onPress={()=>setShowDatePicker(true)}
>

<Text style={styles.dateText}>
{bidEndDate ? formatDate(bidEndDate) : "Select Bid End Date"}
</Text>

</TouchableOpacity>

{showDatePicker && (

<DateTimePicker
value={bidEndDate || new Date()}
mode="date"
minimumDate={new Date()}
onChange={(e,d)=>{
setShowDatePicker(false);
if(d) setBidEndDate(d);
}}
/>

)}

<TouchableOpacity
style={styles.uploadButton}
onPress={pickDocuments}
>

<Text style={styles.uploadText}>Upload Documents (max. 5 files)</Text>
{documents.map((doc, index) => (
<View key={index} style={styles.fileCardRow}>

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
onPress={() => removeLocalDocument(index)}
style={styles.deleteButton}
>
<Text style={styles.deleteText}>✕</Text>
</TouchableOpacity>

</View>
))}

</TouchableOpacity>

<TouchableOpacity
style={styles.createButton}
onPress={handleCreate}
>

<Text style={styles.createText}>
{uploading ? "Creating..." : "Create Listing"}
</Text>

</TouchableOpacity>

</View>

</ScrollView>

);

}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

container:{
padding:24,
paddingBottom:40
},

title:{
fontSize:24,
fontWeight:"800",
color:"#D4AF37",
marginBottom:22,
letterSpacing:0.5
},

card:{
backgroundColor:"#122A4D",
padding:22,
borderRadius:20,
borderWidth:1,
borderColor:"#1E3A63",
shadowColor:"#000",
shadowOpacity:0.25,
shadowRadius:8,
shadowOffset:{width:0,height:3},
elevation:6
},

label:{
color:"#D4AF37",
fontWeight:"600",
marginBottom:8,
fontSize:13,
letterSpacing:0.4
},

toggleRow:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:20
},

toggle:{
width:52,
height:28,
borderRadius:20,
backgroundColor:"#1E3A63",
borderWidth:1,
borderColor:"#D4AF37"
},

toggleActive:{
backgroundColor:"#D4AF37"
},

input:{
backgroundColor:"#0E2445",
borderRadius:14,
paddingVertical:14,
paddingHorizontal:14,
marginBottom:16,
color:"#D4AF37",
borderWidth:1,
borderColor:"#1E3A63",
fontSize:14
},

textArea:{
height:110,
textAlignVertical:"top"
},

dropdownHeader:{
backgroundColor:"#0E2445",
paddingVertical:14,
paddingHorizontal:14,
borderRadius:14,
marginBottom:10,
borderWidth:1,
borderColor:"#1E3A63"
},

dropdownText:{
color:"#D4AF37",
fontSize:14
},

dropdownItem:{
backgroundColor:"#152F59",
color:"#FFFFFF",
paddingVertical:12,
paddingHorizontal:14,
borderRadius:12,
marginBottom:6,
borderWidth:1,
borderColor:"#1E3A63"
},

option:{
color:"#FFFFFF",
fontSize:14
},

dateButton:{
backgroundColor:"#0E2445",
paddingVertical:14,
paddingHorizontal:14,
borderRadius:14,
marginBottom:16,
borderWidth:1,
borderColor:"#1E3A63"
},

dateText:{
color:"#D4AF37",
fontSize:14
},

uploadButton:{
backgroundColor:"#1A3A70",
padding:16,
borderRadius:14,
marginBottom:16,
borderWidth:1,
borderColor:"#284C86"
},

uploadText:{
color:"#FFFFFF",
fontWeight:"700",
textAlign:"center",
marginBottom:10,
letterSpacing:0.4
},

fileCard:{
backgroundColor:"#0E2445",
padding:10,
borderRadius:10,
marginBottom:8,
borderWidth:1,
borderColor:"#1E3A63"
},

fileText:{
color:"#D4AF37",
fontSize:13
},

createButton:{
backgroundColor:"#D4AF37",
paddingVertical:18,
borderRadius:14,
marginTop:8,
shadowColor:"#000",
shadowOpacity:0.3,
shadowRadius:6,
shadowOffset:{width:0,height:2},
elevation:4
},

createText:{
color:"#0B1F3B",
fontWeight:"800",
textAlign:"center",
fontSize:16,
letterSpacing:0.5
},

fileCardRow:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
backgroundColor:"#0E2445",
padding:10,
borderRadius:10,
marginBottom:8,
borderWidth:1,
borderColor:"#1E3A63"
},

deleteButton:{
backgroundColor:"#E11D48",
width:26,
height:26,
borderRadius:13,
alignItems:"center",
justifyContent:"center"
},

deleteText:{
color:"#FFF",
fontWeight:"700"
},

});