const admin = require("firebase-admin");
admin.initializeApp();  
const {onRequest, onCall} = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const APPYFLOW_KEY = defineSecret("APPYFLOW_KEY");

exports.verifyGST = onRequest(
  {
    region: "asia-south1",
    secrets: [APPYFLOW_KEY],
  },
  async (req, res) => {
    try {
      const { gstNo } = req.body;

      if (!gstNo) {
        return res.status(400).json({
          valid: false,
          error: "gstNo required",
        });
      }

      const response = await fetch("https://appyflow.in/api/verifyGST", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gstNo, // ✅ CORRECT FIELD NAME
          key_secret: APPYFLOW_KEY.value(), // ✅ CORRECT AUTH
        }),
      });

      const data = await response.json();

      console.log("GST lookup success:", gstNo);

      if (!data.taxpayerInfo) {
  return res.status(200).json({ valid: false });
}

      return res.json({
  valid: true,

  tradeName: data.taxpayerInfo?.tradeNam || "",
  legalName: data.taxpayerInfo?.lgnm || "",

  address: [
    data.taxpayerInfo?.pradr?.addr?.bnm,
    data.taxpayerInfo?.pradr?.addr?.bno,
    data.taxpayerInfo?.pradr?.addr?.st,
    data.taxpayerInfo?.pradr?.addr?.loc,
  ]
    .filter(Boolean)
    .join(", "),

  city: data.taxpayerInfo?.pradr?.addr?.dst || "",
  pincode: data.taxpayerInfo?.pradr?.addr?.pncd || "",
  state: data.taxpayerInfo?.pradr?.addr?.stcd || "",
});


    } catch (err) {
      console.error("VERIFY GST ERROR:", err);
      return res.status(500).json({ valid: false });
    }
  }
);


exports.handleListingCompletion = onDocumentUpdated(
  {
    document: "listings/{listingId}",
    region: "asia-south1",
  },
  async (event) => {

    if (!event.data) return;

const before = event.data.before?.data();
const after = event.data.after?.data();

if (!before || !after) return;

    if (before.status !== "completed" && after.status === "completed") {

      const awardedTo = after.awardedTo;
      if (!awardedTo) return;

      await admin.firestore()
        .collection("users")
        .doc(awardedTo)
        .update({
          ongoingProjects: admin.firestore.FieldValue.increment(-1),
          totalProjectsCompleted:
            admin.firestore.FieldValue.increment(1),
        });
    }
  }
);

/**
 * Secrets
 */
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

/**
 * Create Razorpay Order
 */

exports.createRazorpayOrder = onCall(
{
  region: "us-central1",
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET],
},
async (request) => {

  if (!request.auth) {
    throw new Error("User not authenticated");
  }

  const uid = request.auth.uid;

  /* GET USER ROLE */

  const userDoc = await admin.firestore()
    .collection("users")
    .doc(uid)
    .get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }
const userData = userDoc.data();
  const role = userDoc.data().role;

  const founderBadge =
    userData?.subscription?.founderBadge || false;

  /* PLAN PRICING */

  let baseAmount;

  if (role === "company") {
    baseAmount = 99900;
  } 
  else if (role === "contractor") {
    baseAmount = 49900;
  } 
  else if (role === "labour") {
    baseAmount = 19900;
  } 
  else {
    throw new Error("Invalid role");
  }

  /* APPLY FOUNDER DISCOUNT */

  let finalAmount = baseAmount;

  if (founderBadge) {
    finalAmount = Math.round(baseAmount * 0.60); // 40% discount
  }

  /* CREATE RAZORPAY INSTANCE */

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  });

  /* CREATE ORDER */

  const order = await razorpay.orders.create({

    amount: finalAmount,
    currency: "INR",
    receipt: `${uid.substring(0,8)}_${Date.now()}`

  });

  return {

    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    founderDiscount: founderBadge

  };

});

/**
 * Verify Razorpay Payment & Activate Subscription
 */
exports.verifyPayment = onCall(
{
  region: "us-central1",
  secrets: [RAZORPAY_KEY_SECRET],
},
async (request) => {

  if (!request.auth) {
    throw new Error("User not authenticated");
  }

  const uid = request.auth.uid;

  const { paymentId, orderId, signature, planId } = request.data;

  if (!paymentId || !orderId || !signature) {
    throw new Error("Invalid payment data");
  }

  /* VERIFY SIGNATURE */

  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Payment verification failed");
  }

  const paymentRef = admin.firestore()
    .collection("payments")
    .doc(orderId);

  const userRef = admin.firestore()
    .collection("users")
    .doc(uid);

  const statsRef = admin.firestore()
    .collection("systemStats")
    .doc("launch");

  const now = admin.firestore.Timestamp.now();

  const planDays = 30;

  /* TRANSACTION */

  await admin.firestore().runTransaction(async (tx) => {

    const paymentDoc = await tx.get(paymentRef);

    if (paymentDoc.exists) {
      return;
    }

    const userDoc = await tx.get(userRef);

    if (!userDoc.exists) {
      throw new Error("User document not found");
    }

    const statsDoc = await tx.get(statsRef);

    let founderPaidUsers = 0;

    if (statsDoc.exists) {
      founderPaidUsers = statsDoc.data().founderPaidUsers || 0;
    }

    let founderBadge = userDoc.data()?.subscription?.founderBadge || false;

if (!founderBadge && founderPaidUsers < 1000) {
  founderBadge = true;
  founderPaidUsers++;

      tx.set(statsRef,{
        founderPaidUsers
      },{merge:true});
    }

    /* CALCULATE EXPIRY */

    let expiresAt;

    const currentSub = userDoc.data().subscription;

    if (
      currentSub &&
      currentSub.expiresAt &&
      currentSub.expiresAt.toMillis() > Date.now()
    ){

      const currentExpiry =
        currentSub.expiresAt.toDate();

      expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(
          currentExpiry.getTime() +
          planDays * 24 * 60 * 60 * 1000
        )
      );

    } else {

      expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(
          Date.now() +
          planDays * 24 * 60 * 60 * 1000
        )
      );

    }

    /* UPDATE USER */

    tx.update(userRef,{

      subscription:{
        planId: planId,
        startsAt: now,
        expiresAt: expiresAt,
        founderBadge: founderBadge,
        freeTrial: false
      }

    });

    /* SAVE PAYMENT */

    tx.set(paymentRef,{

      uid: uid,
      orderId: orderId,
      paymentId: paymentId,
      planId: planId,
      verifiedAt: now,
      status: "paid"

    });

  });

  return { success:true };

});
exports.startFreeTrial = onCall(
{
  region: "us-central1"
},
async (request) => {

  if (!request.auth) {
    throw new Error("User not authenticated");
  }

  const uid = request.auth.uid;

  const statsRef = admin.firestore()
    .collection("systemStats")
    .doc("launch");

  const userRef = admin.firestore()
    .collection("users")
    .doc(uid);

  const now = admin.firestore.Timestamp.now();

  const expiry = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + (30 * 24 * 60 * 60 * 1000)
  );

  await admin.firestore().runTransaction(async (tx) => {

    const statsDoc = await tx.get(statsRef);

    let freeTrialUsers = 0;

    if (statsDoc.exists) {
      freeTrialUsers = statsDoc.data().freeTrialUsers || 0;
    }

    if (freeTrialUsers >= 100) {
      throw new Error("Free trial limit reached");
    }

    freeTrialUsers += 1;

    tx.set(statsRef,{
      freeTrialUsers: freeTrialUsers
    },{merge:true});

    tx.update(userRef,{
      subscription:{
        planId:"free_trial",
        freeTrial:true,
        startsAt: now,
        expiresAt: expiry
      }
    });

  });

  return { success:true };

});
