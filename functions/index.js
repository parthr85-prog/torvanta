const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");

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

      console.log("APPYFLOW RESPONSE:", data);

      if (data.error) {
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
