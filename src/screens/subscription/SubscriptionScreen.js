import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import { useNavigation } from "@react-navigation/native";
import RazorpayCheckout from "react-native-razorpay";

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";


export default function SubscriptionScreen(){

const user = auth().currentUser;
const navigation = useNavigation();

const [role,setRole] = useState(null);
const [subscription,setSubscription] = useState(null);
const [loading,setLoading] = useState(true);
const [processing,setProcessing] = useState(false);

const [founderSlots,setFounderSlots] = useState(null);
const [freeTrialSlots,setFreeTrialSlots] = useState(null);

const goToDashboard = () => {

if(role === "company"){

navigation.reset({
index:0,
routes:[{name:"CompanyDashboard"}]
});

}

else if(role === "contractor"){

navigation.reset({
index:0,
routes:[{name:"ContractorDashboard"}]
});

}

else if(role === "labour"){

navigation.reset({
index:0,
routes:[{name:"LabourDashboard"}]
});

}

};

const plans = {

company:{
price:999,
title:"Company Membership",
features:[
"Unlimited Listings",
"Unlimited Bids",
"Access to all projects",
"Contact unlock after award"
]
},

contractor:{
price:499,
title:"Contractor Membership",
features:[
"Unlimited Bids",
"Unlimited Listings",
"Access to all tenders",
"Contractor profile visibility"
]
},

labour:{
price:199,
title:"Labour Contractor Membership",
features:[
"Unlimited Labour Job Bids",
"Access to labour listings",
"Labour contractor profile"
]
}

};

const goToLogin = async () => {

try{

await auth().signOut();


}catch(e){

console.log("LOGOUT ERROR",e);

}

};

useEffect(()=>{

const loadUser = async()=>{

try{

const snap = await firestore()
.collection("users")
.doc(user.uid)
.get();

if(snap.exists){

const data = snap.data();

setRole(data.role);
setSubscription(data.subscription || null);

}

const statsSnap = await firestore()
.collection("systemStats")
.doc("launch")
.get();

if(statsSnap.exists){
const stats = statsSnap.data() || {};

const paid = stats.founderPaidUsers || 0;
const free = stats.freeTrialUsers || 0;

setFounderSlots(1000 - paid);
setFreeTrialSlots(100 - free);

}else{

setFounderSlots(1000);
setFreeTrialSlots(100);

}

}catch(e){

console.log("USER LOAD ERROR",e);

}

setLoading(false);

};

loadUser();

},[]);

const subscribe = async () => {

try {

setProcessing(true);

/* FREE TRIAL CHECK */

if(subscription?.freeTrial){

const expiry = subscription?.expiresAt?.toDate();

if(expiry && expiry > new Date()){

Alert.alert(
"Free Trial Active",
"You already have 1 month free subscription."
);

setProcessing(false);
return;

}

}

if(founderSlots === 0){
Alert.alert(
"Founder Offer Ended",
"Founding member slots are filled. You can still subscribe normally."
);
}

const createOrder = functions()
  .httpsCallable("createRazorpayOrder");

const res = await createOrder();

const order = res.data;

const options = {

description:"Torvanta Subscription",
image:"https://torvanta.com/logo.png",

currency: order.currency,
amount: order.amount,

key:"rzp_live_SPB6siKH364AZ0",
order_id: order.orderId,

name:"Torvanta",

prefill:{
email:user.email
},

theme:{
color:"#D4AF37"
}

};

const payment = await RazorpayCheckout.open(options);

const verify = functions()
  .httpsCallable("verifyPayment");

await verify({

paymentId: payment.razorpay_payment_id,
orderId: payment.razorpay_order_id,
signature: payment.razorpay_signature,
planId: role

});

Alert.alert("Success","Subscription activated",[
{
text:"Continue",
onPress:goToDashboard
}
]);

} catch(e){

console.log("PAYMENT ERROR",e);
Alert.alert("Payment Failed","Please try again");

}

setProcessing(false);

};

const startFreeTrial = async () => {

try{

setProcessing(true);

const startTrial = functions()
.httpsCallable("startFreeTrial");

await startTrial();

Alert.alert(
"Free Trial Started",
"You now have 30 days free access.",
[
{
text:"Continue",
onPress:goToDashboard
}
]
);

}catch(e){

console.log("FREE TRIAL ERROR",e);

Alert.alert(
"Free Trial Unavailable",
"Free trial slots may be full."
);

}

setProcessing(false);

};


if(loading){

return(


<View style={styles.loader}>

<ActivityIndicator color="#D4AF37"/>

</View>

);

}

const plan = plans[role] || null;

    if (!plan) {
return (
<View style={styles.loader}>
<ActivityIndicator color="#D4AF37" />
</View>
);
}

const discountedPrice = Math.round(plan.price * 0.6);
const finalPrice =
subscription?.founderBadge
? discountedPrice
: founderSlots > 0
? discountedPrice
: plan.price;

const isActive =
subscription?.expiresAt &&
subscription.expiresAt.toDate() > new Date();

return(

<View style={styles.container}>

<Text style={styles.title}>
Torvanta Membership
</Text>

<View style={styles.card}>

<Text style={styles.planTitle}>
{plan.title}
</Text>

{subscription?.freeTrial && (
<View style={{marginTop:10}}>
<Text style={{color:"#22C55E",fontSize:12}}>
🎁 You received 1 month free subscription
</Text>
</View>
)}

{freeTrialSlots > 0 && (

<Text style={{
color:"#22C55E",
marginTop:6,
fontWeight:"600"
}}>
🎁 Free Trial Slots Left: {freeTrialSlots} / 100
</Text>

)}

{subscription?.founderBadge && (
<Text style={{
color:"#FBBF24",
marginBottom:6,
fontWeight:"700"
}}>
⭐ Founding Member – Lifetime 40% Discount
</Text>
)}

<Text style={styles.price}>
₹{finalPrice} / month
</Text>

{plan.features.map((f,i)=>(
<Text key={i} style={styles.feature}>
• {f}
</Text>
))}

{founderSlots > 0 && (

<View style={styles.founding}>

<Text style={styles.foundingText}>
🚀 Founding Member Offer
</Text>

<Text style={styles.foundingSub}>
First 1000 PAID members get Founding Member Badge + 40% lifetime discount
</Text>

<Text style={{
color: founderSlots < 100 ? "#EF4444" : "#FBBF24",
marginTop:6,
fontWeight:"600"
}}>
🔥 Founders Joined: {1000 - founderSlots} / 1000 
</Text>
<Text style={{
color: "#FBBF24",
marginTop:6,
fontWeight:"700"
}}>
⭐ Become Founder #{1000 - founderSlots + 1}
</Text>

</View>

)}

{freeTrialSlots > 0 && !subscription?.freeTrial && !isActive && (

<TouchableOpacity
style={[styles.button,{backgroundColor:"#22C55E"}]}
onPress={startFreeTrial}
>

<Text style={styles.buttonText}>
Start Free Trial
</Text>

</TouchableOpacity>

)}
<TouchableOpacity
style={styles.button}
onPress={subscribe}
disabled={processing || isActive}
>

<Text style={styles.buttonText}>
{isActive
? "Subscription Active"
: processing
? "Processing..."
: "Subscribe Now"}
</Text>

</TouchableOpacity>

</View>
<TouchableOpacity
style={styles.backButton}
onPress={goToLogin}
>

<Text style={styles.backText}>
Back to Login
</Text>

</TouchableOpacity>

</View>

);

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#0B1F3B",
justifyContent:"center",
padding:20
},

loader:{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"#0B1F3B"
},

title:{
fontSize:22,
fontWeight:"700",
color:"#FFFFFF",
textAlign:"center",
marginBottom:20
},

card:{
backgroundColor:"#122A4D",
padding:24,
borderRadius:18,
borderWidth:1,
borderColor:"#1E3A63"
},

planTitle:{
fontSize:18,
fontWeight:"700",
color:"#D4AF37",
marginBottom:6
},

price:{
fontSize:20,
fontWeight:"700",
color:"#FFFFFF",
marginBottom:12
},

feature:{
color:"#C7D2E2",
marginTop:4
},

founding:{
marginTop:14,
backgroundColor:"#1E3A63",
padding:10,
borderRadius:10
},

foundingText:{
color:"#FBBF24",
fontWeight:"700"
},

foundingSub:{
color:"#C7D2E2",
fontSize:12
},

button:{
marginTop:20,
backgroundColor:"#D4AF37",
padding:14,
borderRadius:12
},

buttonText:{
color:"#0B1F3B",
fontWeight:"700",
textAlign:"center"
},

backButton:{
marginTop:14,
padding:12,
borderRadius:10,
borderWidth:1,
borderColor:"#D4AF37"
},

backText:{
color:"#D4AF37",
fontWeight:"600",
textAlign:"center"
}

});