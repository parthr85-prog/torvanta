import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function MyDownloads(){

const [folders,setFolders] = useState([]);
const navigation = useNavigation();

const user = auth().currentUser;

if(!user) return null;

const indexFile =
FileSystem.documentDirectory +
"Torvanta/" +
user.uid +
"/downloadIndex.json";

const readDownloadIndex = async () => {

try{

const info =
await FileSystem.getInfoAsync(indexFile);

if(!info.exists) return [];

const data =
await FileSystem.readAsStringAsync(indexFile);

return JSON.parse(data);

}catch{

return [];

}

};

const writeDownloadIndex = async (data) => {

await FileSystem.writeAsStringAsync(
indexFile,
JSON.stringify(data,null,2)
);

};

const cleanupExpiredDownloads = async()=>{

try{

const root =
FileSystem.documentDirectory +
"Torvanta/" +
auth().currentUser.uid +
"/";

const rootInfo =
await FileSystem.getInfoAsync(root);

if(!rootInfo.exists) return;

const folders =
await FileSystem.readDirectoryAsync(root);

for(const folder of folders){

const metaPath =
root + folder + "/meta.json";

const metaInfo =
await FileSystem.getInfoAsync(metaPath);

if(!metaInfo.exists) continue;

const meta =
JSON.parse(
await FileSystem.readAsStringAsync(metaPath)
);

if(!meta.expiryDate) continue;

const expiry =
new Date(meta.expiryDate);

/* DELETE AFTER 15 DAYS */

const deleteDate =
new Date(expiry);

deleteDate.setDate(
deleteDate.getDate() + 15
);

if(new Date() > deleteDate){

await FileSystem.deleteAsync(
root + folder,
{ idempotent:true }
);

}

}

}catch(e){

console.log(
"DOWNLOAD CLEANUP ERROR",
e
);

}

};
useEffect(()=>{

const loadData = async()=>{

await cleanupExpiredDownloads();
await loadDownloads();

};

loadData();

const unsubscribe =
navigation.addListener("focus",loadData);

return unsubscribe;

},[]);

/* ROOT USER DOWNLOAD DIRECTORY */

const rootFolder =
FileSystem.documentDirectory +
"Torvanta/" +
user.uid +
"/";

/* ---------------- LOAD DOWNLOADS ---------------- */

const loadDownloads = async()=>{

try{

const index =
await readDownloadIndex();

if(!index.length){

setFolders([]);
return;

}

const grouped = {};

index.forEach(item=>{

if(!grouped[item.folderName]){

grouped[item.folderName] = {
listingId:item.folderName,
files:[],
meta:{
expiryDate:item.expiryDate
}
};

}

grouped[item.folderName].files.push(
item.fileName
);

});

setFolders(Object.values(grouped));

}catch(e){

console.log("DOWNLOAD LOAD ERROR",e);

}

};

/* ---------------- OPEN FILE ---------------- */

const openFile = async (listingId,fileName)=>{

try{

const filePath =
rootFolder +
listingId +
"/" +
fileName;

navigation.navigate(
"DocumentViewer",
{ uri:filePath }
);

}catch(err){

Alert.alert("Unable to open file");

}

};

/* ---------------- DELETE FILE ---------------- */

const deleteFile = async (listingId,fileName)=>{

try{

const filePath =
rootFolder + listingId + "/" + fileName;

await FileSystem.deleteAsync(filePath);

Alert.alert("File deleted");

let index = await readDownloadIndex();

index = index.filter(
i =>
!(i.folderName === listingId &&
i.fileName === fileName)
);

await writeDownloadIndex(index);

loadDownloads();

}catch(err){

Alert.alert("Delete failed");

}

};

const getExpiryText = (expiryDate) => {

if(!expiryDate) return "";

const expiry = new Date(expiryDate);

const deleteDate = new Date(expiry);
deleteDate.setDate(deleteDate.getDate() + 15);

const diff =
Math.ceil(
(deleteDate - new Date()) /
(1000 * 60 * 60 * 24)
);

if(diff <= 0){
return "Expired — deleting soon";
}

return `Expires in ${diff} days`;

};

/* ---------------- RENDER FILE ---------------- */

const renderFile = (file, listingId) => {

return(

<View key={`${listingId}-${file}`} style={styles.fileRow}>

<Text style={styles.fileName}>
📄 {String(file)}
</Text>

<View style={styles.fileActions}>

<TouchableOpacity
style={styles.openBtn}
onPress={()=>openFile(listingId,file)}
>
<Text style={styles.btnText}>Open</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.deleteBtn}
onPress={()=>deleteFile(listingId,file)}
>
<Text style={styles.btnText}>Delete</Text>
</TouchableOpacity>

</View>

</View>

);

};


/* ---------------- RENDER FOLDER ---------------- */

const renderFolder = ({item}) => {

return(

<View style={styles.folderCard}>

<Text style={styles.folderTitle}>
{item.listingId}
</Text>

{item.meta?.expiryDate && (

<Text style={styles.expiryText}>
{getExpiryText(item.meta.expiryDate)}
</Text>

)}

{item.files.map(file =>
renderFile(file,item.listingId)
)}

</View>

);

};


/* ---------------- UI ---------------- */

return(

<View style={styles.container}>

<Text style={styles.title}>
My Downloads
</Text>

{folders.length === 0 ? (

<Text style={styles.empty}>
No downloaded documents
</Text>

):( 

<FlatList
data={folders}
keyExtractor={(item)=>item.listingId}
renderItem={renderFolder}
contentContainerStyle={{padding:16}}
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

title:{
fontSize:22,
fontWeight:"700",
color:"#FFFFFF",
padding:16
},

empty:{
textAlign:"center",
marginTop:40,
color:"#C7D2E2"
},

folderCard:{
backgroundColor:"#122A4D",
padding:16,
borderRadius:16,
marginBottom:16,
borderWidth:1,
borderColor:"#1E3A63"
},

folderTitle:{
color:"#D4AF37",
fontWeight:"700",
marginBottom:10
},

fileRow:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:8
},

fileName:{
color:"#FFFFFF",
flex:1
},

fileActions:{
flexDirection:"row"
},

openBtn:{
backgroundColor:"#22C55E",
paddingHorizontal:10,
paddingVertical:6,
borderRadius:8,
marginRight:6
},

deleteBtn:{
backgroundColor:"#EF4444",
paddingHorizontal:10,
paddingVertical:6,
borderRadius:8
},

btnText:{
color:"#FFFFFF",
fontWeight:"600"
},
expiryText:{
color:"#FBBF24",
fontSize:12,
marginBottom:8
}

});