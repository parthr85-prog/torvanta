import firestore from "@react-native-firebase/firestore";

import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import SubscriptionScreen from "./SubscriptionScreen";

export default function SubscriptionGuard({ children, user }) {



const [checking,setChecking] = useState(true);
const [active,setActive] = useState(false);

useEffect(()=>{

const checkSubscription = async()=>{

try{

const snap = await firestore()
.collection("users")
.doc(user.uid)
.get();

if(!snap.exists){
setActive(false);
setChecking(false);
return;
}

const data = snap.data();

const expiresAt =
data?.subscription?.expiresAt;

if(!expiresAt){

setActive(false);

}else{

const expiryDate =
expiresAt.toDate();

if(expiryDate > new Date()){
setActive(true);
}else{
setActive(false);
}

}

}catch(e){

console.log("SUBSCRIPTION CHECK ERROR",e);
setActive(false);

}

setChecking(false);

};

checkSubscription();

},[]);

if(checking){

return(

<View style={{flex:1,justifyContent:"center",alignItems:"center"}}>

<ActivityIndicator color="#D4AF37"/>

</View>

);

}

if(!active){

return <SubscriptionScreen/>;

}

return children;

}