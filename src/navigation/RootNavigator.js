import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

import DocumentViewer from "../screens/common/DocumentViewer";
import MyDownloads from "../screens/common/MyDownloads";
import NotificationScreen from "../screens/common/NotificationsScreen";
import ViewUserProfile from "../screens/common/view-user-profile";

import CompanyDrawer from "../screens/company/CompanyDrawer";
import CompanyDashboard from "../screens/company/dashboard";
import MyBids from "../screens/company/my-bids";
import RateUser from "../screens/company/RateUser";
import ViewListing from "../screens/company/view-listing";
import ViewMyListing from "../screens/company/view-my-listing";

import ContractorDrawer from "../screens/contractor/ContractorDrawer";
import ContractorDashboard from "../screens/contractor/dashboard";

import LabourDashboard from "../screens/labour/dashboard";
import LabourDrawer from "../screens/labour/LabourDrawer";

import {
  ActivityIndicator,
  View
} from "react-native";
import { useRegisteringState } from "../../registrationState"; // adjust path
import LegalPage from "../screens/common/LegalPage";
import SubscriptionGuard from "../screens/subscription/SubscriptionGuard";
import SubscriptionScreen from "../screens/subscription/SubscriptionScreen";
import AuthStack from "./AuthStack";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {

const [user,setUser] = useState(null);
const [role,setRole] = useState(null);
const [loading,setLoading] = useState(true);
const [registered,setRegistered] = useState(false);
const { isRegistering } = useRegisteringState();
const showAuth = !user || (!registered && !isRegistering);



useEffect(()=>{

const unsubscribe =
auth().onAuthStateChanged(async(firebaseUser)=>{

if(!firebaseUser){
setUser(null);
setRole(null);
setRegistered(false);
setLoading(false);
return;
}

setUser(firebaseUser);

try{

const snap = await firestore()
.collection("users")
.doc(firebaseUser.uid)
.get();

if (snap.exists) {
  const data = snap.data();

  if (data && data.role) {
    setRole(data.role);
    setRegistered(true);
  } else {
    console.log("ROLE MISSING IN USER DOC");
    setRegistered(false);
    setRole(null);
  }
} else {
  setRegistered(false);
  setRole(null);
}
console.log("USER:", firebaseUser?.uid);
console.log("ROLE SNAP:", snap.data());
}catch(e){

console.log("ROLE FETCH ERROR:",e);
setRole(null);

}finally{
setLoading(false);
}

});

return unsubscribe;

},[]);

if (loading || (user && !registered && !isRegistering)) {
  return (
    <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
      <ActivityIndicator size="large" color="#D4AF37"/>
    </View>
  );
}

function CompanyWithSubscription(){
return(
<SubscriptionGuard user ={user} >
<CompanyDrawer/>
</SubscriptionGuard>
);
}

function ContractorWithSubscription(){
return(
<SubscriptionGuard user ={user} >
<ContractorDrawer/>
</SubscriptionGuard>
);
}

function LabourWithSubscription(){
return(
<SubscriptionGuard user ={user} >
<LabourDrawer/>
</SubscriptionGuard>
);
}


return(

<Stack.Navigator
  key={user ? "app" : "auth"}
  screenOptions={{ headerShown: false }}
>

{ showAuth ? (

<Stack.Screen
name="Auth"
component={AuthStack}
/>

) : role === "company" ? (

<Stack.Screen
name="Company"
component={CompanyWithSubscription}
/>

) : role === "contractor" ? (

<Stack.Screen
name="Contractor"
component={ContractorWithSubscription}
/>

) : role === "labour" ? (

<Stack.Screen
name="Labour"
component={LabourWithSubscription}
/>

) : (
  <Stack.Screen name="Auth" component={AuthStack} />
)}

{/* COMMON SCREENS */}

<Stack.Screen name="CompanyDashboard" component={CompanyDashboard}/>
<Stack.Screen name="ContractorDashboard" component={ContractorDashboard}/>
<Stack.Screen name="LabourDashboard" component={LabourDashboard}/>
<Stack.Screen name="ViewListing" component={ViewListing}/>
<Stack.Screen name="ViewMyListing" component={ViewMyListing}/>
<Stack.Screen name="MyBids" component={MyBids}/>
<Stack.Screen name="RateUser" component={RateUser}/>
<Stack.Screen name="ViewUserProfile" component={ViewUserProfile}/>
<Stack.Screen name="NotificationScreen" component={NotificationScreen}/>
<Stack.Screen name="MyDownloads" component={MyDownloads}/>
<Stack.Screen name="DocumentViewer" component={DocumentViewer}/>
<Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen}/>
<Stack.Screen name="LegalPage" component={LegalPage} />

</Stack.Navigator>

);
}
