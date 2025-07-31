const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const compressPDF = require("./routes/compress");
const handleMerge = require("./routes/merge");
const handleSplit = require("./routes/split");

const app = express();
const PORT = process.env.PORT || 3000;



app.use(cors());
app.use(express.json());
app.use("/compressed", express.static("compressed"));
app.use(express.static(path.join(__dirname, "../frontend")));

const upload = multer({ dest: "uploads/" });

app.post("/api/compress", upload.single("pdfFile"), async (req, res) => {
  try {
    const file = req.file;
    const targetSizeKB = parseInt(req.body.targetSize);

    if (!file || isNaN(targetSizeKB)) {
      return res.status(400).send("Invalid file or target size");
    }

    const outputBase = path.join(__dirname, "compressed", file.filename);
    const finalOutputPath = `${outputBase}-compressed.pdf`;

    await compressPDF(file.path, outputBase, targetSizeKB);

    // Delay helps ensure file system finishes writing
    setTimeout(() => {
      res.download(finalOutputPath, "compressed.pdf", (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).send("Failed to send file");
        } else {
          // Cleanup (optional)
          fs.unlink(file.path, () => {});
          fs.unlink(finalOutputPath, () => {});
        }
      });
    }, 300);

  } catch (err) {
    console.error("Compression error:", err.message);
    res.status(500).send("Compression failed");
  }
});

// ✅ Merge PDFs route
app.post("/api/merge", upload.array("pdfFiles"), handleMerge);

// ✅ Split PDF route
app.post("/api/split", upload.single("pdfFile"), handleSplit);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
