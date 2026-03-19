import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";

import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { listingCategories } from "../../../config/listingCategories";
import VerificationBadge from "../../components/VerificationBadge";
import DashboardHeader from "../company/DashboardHeader";


export default function CompanyDashboard(){

const navigation = useNavigation();
const currentUser = auth().currentUser;

/* ---------------- STATE ---------------- */

const [listings,setListings] = useState([]);
const [filteredListings,setFilteredListings] = useState([]);

const [loadingListings,setLoadingListings] = useState(true);
const [loadingProfile,setLoadingProfile] = useState(true);

const [labourName,setLabourName] = useState("");
const [verificationLevel,setVerificationLevel] = useState("basic");

const [userDistrict,setUserDistrict] = useState("");
const [userState,setUserState] = useState("");

/* ---------------- LOCATION MODE ---------------- */

const [locationMode,setLocationMode] = useState("district");

/* ---------------- FILTERS ---------------- */

const [categoryFilter,setCategoryFilter] = useState("");
const [districtFilter,setDistrictFilter] = useState("");

const [minValue,setMinValue] = useState("");
const [maxValue,setMaxValue] = useState("");

const [showFilters,setShowFilters] = useState(false);

const [filterCategory,setFilterCategory] = useState("");
const [filterSubCategory,setFilterSubCategory] = useState("");

const [filterState,setFilterState] = useState("");
const [filterDistrict,setFilterDistrict] = useState("");

const [filterWorkType,setFilterWorkType] = useState("");
const [filterContractType,setFilterContractType] = useState("");

const [filterVerification,setFilterVerification] = useState("");

const [filterMinValue,setFilterMinValue] = useState("");
const [filterMaxValue,setFilterMaxValue] = useState("");

/* FILTER DROPDOWNS */

const [categoryOpen,setCategoryOpen] = useState(false);
const [subCategoryOpen,setSubCategoryOpen] = useState(false);

const [workTypeOpen,setWorkTypeOpen] = useState(false);
const [contractTypeOpen,setContractTypeOpen] = useState(false);

const [verificationOpen,setVerificationOpen] = useState(false);

const [statesList,setStatesList] = useState([]);
const [districtsList,setDistrictsList] = useState([]);

const [stateOpen,setStateOpen] = useState(false);
const [districtOpen,setDistrictOpen] = useState(false);


/* ---------------- LOAD PROFILE ---------------- */

useEffect(()=>{

const loadProfile = async ()=>{

try{

if(!currentUser) return;

const snap = await firestore()
.collection("users")
.doc(currentUser.uid)
.get();

if(!snap.exists) return;

const data = snap.data();

if (
  !data.subscription ||
  !data.subscription.expiresAt ||
  data.subscription.expiresAt.toMillis() < Date.now()
) {
  navigation.replace("SubscriptionScreen");
}

setLabourName(data.name || "");
setVerificationLevel(data.verificationLevel || "basic");

setUserDistrict(data.district || "");
setUserState(data.state || "");

}catch(err){

console.log("PROFILE ERROR",err);

}finally{

setLoadingProfile(false);

}

};

loadProfile();

},[]);

/* ---------------- FETCH LISTINGS ---------------- */

useEffect(()=>{

const fetchListings = async()=>{

try{

if(!currentUser) return;

const now = new Date();

const snapshot = await firestore()
.collection("listings")
.where("status","==","open")
.where("bidEndDate",">",now)
.get();

let results = snapshot.docs
.map(d=>({
id:d.id,
...d.data()
}))
.filter(l => l.createdBy !== currentUser.uid);

/* -------- LOCATION PRIORITY SORT -------- */

/* -------- LOCATION PRIORITY SORT -------- */

results.sort((a,b)=>{

const aDistrict = a.district === userDistrict;
const bDistrict = b.district === userDistrict;

if(aDistrict && !bDistrict) return -1;
if(!aDistrict && bDistrict) return 1;

const aState = a.state === userState;
const bState = b.state === userState;

if(aState && !bState) return -1;
if(!aState && bState) return 1;

return 0;

});

setListings(results);
setFilteredListings(results);

/* BUILD STATE LIST */

const states = [
...new Set(results.map(l => l.state).filter(Boolean))
];

setStatesList(states);



/* -------- DISTRICT PRIORITY SORT -------- */


}catch(err){

console.log("LISTING ERROR",err);

}finally{

setLoadingListings(false);

}

};

fetchListings();

},[userDistrict,userState]);

/* ---------------- APPLY FILTERS ---------------- */

const applyFilters = () => {

let data = [...listings];

if(filterCategory){
data = data.filter(l=>l.category === filterCategory);
}

if(filterSubCategory){
data = data.filter(l=>l.subCategory === filterSubCategory);
}

if(filterState){
data = data.filter(l=>l.state === filterState);
}

if(filterDistrict){
data = data.filter(l=>l.district === filterDistrict);
}

if(filterWorkType){
data = data.filter(l=>l.workType === filterWorkType);
}

if(filterContractType){
data = data.filter(l=>l.contractType === filterContractType);
}

if(filterMinValue){
data = data.filter(
l=>l.estimatedValue >= Number(filterMinValue)
);
}

if(filterMaxValue){
data = data.filter(
l=>l.estimatedValue <= Number(filterMaxValue)
);
}

setFilteredListings(data);
setShowFilters(false);

};

/*-----------------RESET FILTER--------------------*/

const resetFilters = () => {

setFilterCategory("");
setFilterSubCategory("");

setFilterState("");
setFilterDistrict("");

setFilterWorkType("");
setFilterContractType("");

setFilterVerification("");

setFilterMinValue("");
setFilterMaxValue("");

setFilteredListings(listings);

};

/* ---------------- VALUE FORMAT ---------------- */

const formatCurrency = value=>{

if(!value) return "";

return new Intl.NumberFormat("en-IN",{
style:"currency",
currency:"INR",
maximumFractionDigits:0
}).format(value);

};

/* ---------------- RENDER LISTING ---------------- */

function renderItem({item}){

return(

<View style={styles.card}>

{item.urgent && (
<Text style={styles.urgent}>URGENT</Text>
)}

<Text style={styles.cardTitle}>{item.title}</Text>

<Text style={styles.createdByCompanyName}>
{item.createdByCompanyName}
</Text>

<VerificationBadge level={item.verificationLevel}/>

<Text style={styles.meta}>
{item.category} • {item.subCategory}
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

<Text style={styles.meta}>
📍 {item.subDistrict}, {item.district}, {item.state}
</Text>

{item.exactLocation ? (
<Text style={styles.meta}>
📌 {item.exactLocation}
</Text>
):null}

<Text style={styles.value}>
{formatCurrency(item.estimatedValue)}
</Text>

<TouchableOpacity
style={styles.viewBtn}
onPress={()=>
navigation
.getParent()
.navigate("ViewListing",{listingId:item.id})
}
>

<Text style={styles.viewText}>View Listing</Text>

</TouchableOpacity>

</View>

);

}

/* ---------------- UI ---------------- */

return(

<View style={styles.container}>

<DashboardHeader
title={loadingProfile ? "Welcome" : `Welcome, ${labourName}`}
/>

<View style={styles.badgeContainer}>
<VerificationBadge level={verificationLevel}/>
</View>

{/* FILTERS */}

<View style={{alignItems:"flex-end",paddingHorizontal:16}}>

<TouchableOpacity
onPress={()=>setShowFilters(!showFilters)}
style={{
backgroundColor:"#122A4D",
padding:10,
borderRadius:10
}}
>

<Text style={{color:"#D4AF37",fontWeight:"700"}}>
⚙ Filters
</Text>

</TouchableOpacity>

</View>

{showFilters && (

<View style={styles.filterPanel}>

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setCategoryOpen(!categoryOpen)}
>

<Text style={styles.dropdownText}>
{filterCategory || "Select Category"}
</Text>

</TouchableOpacity>

{categoryOpen && listingCategories.map(item=>(

<TouchableOpacity
key={item.name}
style={styles.dropdownItem}
onPress={()=>{
setFilterCategory(item.name);
setFilterSubCategory("");
setCategoryOpen(false);
}}
>

<Text style={styles.option}>{item.name}</Text>

</TouchableOpacity>

))}

{filterCategory !== "" && (

<>

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setSubCategoryOpen(!subCategoryOpen)}
>

<Text style={styles.dropdownText}>
{filterSubCategory || "Select Sub Category"}
</Text>

</TouchableOpacity>

{subCategoryOpen && listingCategories
.find(c=>c.name === filterCategory)
?.subCategories
.map(item=>(

<TouchableOpacity
key={item}
style={styles.dropdownItem}
onPress={()=>{
setFilterSubCategory(item);
setSubCategoryOpen(false);
}}
>

<Text style={styles.option}>{item}</Text>

</TouchableOpacity>

))}

</>

)}
<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setStateOpen(!stateOpen)}
>

<Text style={styles.dropdownText}>
{filterState || "Select State"}
</Text>

</TouchableOpacity>

{stateOpen && statesList.map(item=>(

<TouchableOpacity
key={item}
style={styles.dropdownItem}
onPress={()=>{

setFilterState(item);
setFilterDistrict("");
setStateOpen(false);

/* BUILD DISTRICT LIST FOR SELECTED STATE */

const districts = [
...new Set(
listings
.filter(l => l.state === item)
.map(l => l.district)
.filter(Boolean)
)
];

setDistrictsList(districts);

}}
>

<Text style={styles.option}>{item}</Text>

</TouchableOpacity>

))}

{filterState !== "" && (

<>

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setDistrictOpen(!districtOpen)}
>

<Text style={styles.dropdownText}>
{filterDistrict || "Select District"}
</Text>

</TouchableOpacity>

{districtOpen && districtsList.map(item=>(

<TouchableOpacity
key={item}
style={styles.dropdownItem}
onPress={()=>{
setFilterDistrict(item);
setDistrictOpen(false);
}}
>

<Text style={styles.option}>{item}</Text>

</TouchableOpacity>

))}

</>

)}

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setWorkTypeOpen(!workTypeOpen)}
>

<Text style={styles.dropdownText}>
{filterWorkType || "Work Type"}
</Text>

</TouchableOpacity>

{workTypeOpen && ["labour","labour_material"].map(v=>(

<TouchableOpacity
key={v}
style={styles.dropdownItem}
onPress={()=>{
setFilterWorkType(v);
setWorkTypeOpen(false);
}}
>

<Text style={styles.option}>
{v === "labour" ? "Only Labour" : "Labour + Material"}
</Text>

</TouchableOpacity>

))}

<TouchableOpacity
style={styles.dropdownHeader}
onPress={()=>setContractTypeOpen(!contractTypeOpen)}
>

<Text style={styles.dropdownText}>
{filterContractType || "Contract Type"}
</Text>

</TouchableOpacity>

{contractTypeOpen && ["item_rate","back_to_back","lump_sum"].map(v=>(

<TouchableOpacity
key={v}
style={styles.dropdownItem}
onPress={()=>{
setFilterContractType(v);
setContractTypeOpen(false);
}}
>

<Text style={styles.option}>
{v.replace("_"," ")}
</Text>

</TouchableOpacity>

))}

<TextInput
style={styles.filterInput}
placeholder="Min Value"
keyboardType="numeric"
placeholderTextColor="#8FA3BF"
value={filterMinValue}
onChangeText={setFilterMinValue}
/>

<TextInput
style={styles.filterInput}
placeholder="Max Value"
keyboardType="numeric"
placeholderTextColor="#8FA3BF"
value={filterMaxValue}
onChangeText={setFilterMaxValue}
/>

<TouchableOpacity
style={{
backgroundColor:"#D4AF37",
padding:12,
borderRadius:12,
marginTop:10
}}
onPress={applyFilters}
>

<Text style={{
textAlign:"center",
fontWeight:"700",
color:"#0B1F3B"
}}>
Search
</Text>


</TouchableOpacity>

<TouchableOpacity
style={{
backgroundColor:"#1E3A63",
padding:12,
borderRadius:12,
marginTop:8
}}
onPress={resetFilters}
>

<Text style={{
textAlign:"center",
fontWeight:"700",
color:"#FFFFFF"
}}>
Reset Filters
</Text>

</TouchableOpacity>

</View>

)}

{/* LISTINGS */}

{loadingListings ? (

<Text style={styles.loading}>
Loading listings...
</Text>

) : filteredListings.length === 0 ? (

<Text style={styles.loading}>
No listings available
</Text>

) : (

<FlatList
data={filteredListings}
keyExtractor={(item)=>item.id}
renderItem={renderItem}
contentContainerStyle={{
padding:16,
paddingBottom:40
}}
showsVerticalScrollIndicator={false}
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

badgeContainer:{
paddingHorizontal:16,
paddingVertical:10
},

tab:{
backgroundColor:"#122A4D",
paddingVertical:8,
paddingHorizontal:16,
borderRadius:12
},

tabActive:{
backgroundColor:"#D4AF37"
},

tabText:{
color:"#FFFFFF",
fontWeight:"600"
},

filterPanel:{
paddingHorizontal:16,
marginBottom:10
},

filterInput:{
backgroundColor:"#122A4D",
borderRadius:12,
padding:10,
marginBottom:8,
color:"#FFFFFF",
borderWidth:1,
borderColor:"#1E3A63"
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

urgent:{
color:"#FF4D4D",
fontWeight:"800",
marginBottom:6
},

cardTitle:{
fontSize:17,
fontWeight:"700",
color:"#FFFFFF"
},

createdByCompanyName:{
marginTop:6,
fontWeight:"600",
color:"#D4AF37"
},

meta:{
marginTop:4,
color:"#C7D2E2"
},

value:{
marginTop:6,
fontWeight:"700",
color:"#22C55E"
},

viewBtn:{
marginTop:14,
alignSelf:"flex-start",
backgroundColor:"#D4AF37",
paddingHorizontal:16,
paddingVertical:8,
borderRadius:12
},

viewText:{
color:"#0B1F3B",
fontWeight:"700"
},
dropdownHeader:{
backgroundColor:"#0E2445",
padding:14,
borderRadius:14,
marginBottom:10,
borderWidth:1,
borderColor:"#1E3A63"
},

dropdownText:{
color:"#FFFFFF"
},

dropdownItem:{
backgroundColor:"#1E3A63",
padding:12,
borderRadius:10,
marginBottom:6
},

option:{
color:"#FFFFFF"
}

});