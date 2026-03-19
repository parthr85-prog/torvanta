import { WebView } from "react-native-webview";

export default function LegalPage({ route }) {

return(

<WebView
source={{ uri: route.params.url }}
startInLoadingState={true}
/>

);

}