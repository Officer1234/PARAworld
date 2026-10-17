
const express = require("express");
const cors = require("cors");
const multer = require("multer");

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

app.post("/api/support-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Please select an image."
    });
  }

  res.json({
    message: "Image received successfully.",
    filename: req.file.originalname,
    size: req.file.size
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(400).json({
    error: err.message || "Request failed."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PARAworld backend running on port ${PORT}`);
});
