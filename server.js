
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "https://sbafdic-banking.vercel.app",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Please upload an image file."));
    }
    callback(null, true);
  }
});

app.get("/", (req, res) => {
  res.json({
    app: "PARAworld Backend",
    status: "running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/support-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select an image."
      });
    }

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail environment variables are missing.");
      return res.status(500).json({
        error: "Support email is not configured."
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000
    });

    await transporter.sendMail({
      from: gmailUser,
      to: gmailUser,
      subject: "PARAworld Customer Support Image",
      text: "A customer submitted an image for support review.",
      attachments: [{
        filename: path.basename(req.file.originalname),
        content: req.file.buffer,
        contentType: req.file.mimetype
      }]
    });

    console.log("Support image email sent successfully.");

    return res.json({
      message: "Support image emailed successfully."
    });
  } catch (error) {
    console.error("Support image email failed:", {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode
    });

    return res.status(500).json({
      error: "Unable to email the image. Please check the server configuration."
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
