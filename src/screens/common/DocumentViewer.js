import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Alert, View } from "react-native";
import Pdf from "react-native-pdf";

export default function DocumentViewer({ route }) {

const { uri } = route.params;

/* ENSURE VALID FILE URI */

const fileUri =
uri.startsWith("file://") ? uri : "file://" + uri;

const lower = fileUri.toLowerCase();

/* FILE TYPE DETECTION */

const isPdf = lower.endsWith(".pdf");

const isImage =
lower.endsWith(".jpg") ||
lower.endsWith(".jpeg") ||
lower.endsWith(".png");

const isOffice =
lower.endsWith(".doc") ||
lower.endsWith(".docx") ||
lower.endsWith(".xls") ||
lower.endsWith(".xlsx");

/* OPEN WORD / EXCEL FILES USING SYSTEM APP CHOOSER */

if (isOffice) {

Linking.canOpenURL(fileUri)
.then((supported) => {

if (supported) {

Linking.openURL(fileUri);

} else {

Alert.alert(
"Cannot open file",
"Please install Microsoft Word, Excel or WPS Office to open this file."
);

}

})
.catch(() => {

Alert.alert(
"Error",
"Unable to open this document."
);

});

return null;

}

return (

<View style={{ flex:1, backgroundColor:"#000" }}>

{/* PDF VIEWER */}

{isPdf && (

<Pdf
source={{ uri:fileUri }}
style={{ flex:1 }}
trustAllCerts={false}
/>

)}

{/* IMAGE VIEWER */}

{isImage && (

<Image
source={{ uri:fileUri }}
style={{ flex:1 }}
contentFit="contain"
/>

)}

</View>

);

}