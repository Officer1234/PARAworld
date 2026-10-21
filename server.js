const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: [
    "https://sbafdic-banking.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ]
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Please upload an image."));
    }
    callback(null, true);
  }
});

app.get("/", (req, res) => {
  res.json({ app: "PARAworld Backend", status: "running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/support-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please select an image." });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const supportEmail = process.env.SUPPORT_EMAIL;

    if (!apiKey || !supportEmail) {
      console.error("RESEND_API_KEY or SUPPORT_EMAIL is missing.");
      return res.status(500).json({
        error: "Support email is not configured."
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PARAworld Support <onboarding@resend.dev>",
        to: [supportEmail],
        subject: "PARAworld Customer Support Image",
        text: "A customer submitted an image for support review.",
        attachments: [{
          filename: req.file.originalname.replace(/[\\/]/g, "_"),
          content: req.file.buffer.toString("base64")
        }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", response.status, result);
      return res.status(502).json({
        error: "The email provider could not send the support email."
      });
    }

    console.log("Support email accepted by Resend:", result.id);

    return res.json({
      message: "Support email accepted for delivery."
    });
  } catch (error) {
    console.error("Support image email failed:", error.message);
    return res.status(500).json({
      error: "Unable to send the support email."
    });
  }
});

app.use((err, req, res, next) => {
  console.error("Request error:", err.message);
  res.status(400).json({
    error: err.message || "Request failed."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PARAworld backend running on port ${PORT}`);
});
