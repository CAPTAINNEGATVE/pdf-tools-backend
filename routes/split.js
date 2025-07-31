const path = require("path");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

module.exports = async function (req, res) {
  try {
    const file = req.file;
    const splitPage = parseInt(req.body.page);

    if (!file || isNaN(splitPage)) {
      return res.status(400).send("PDF file or split page number is missing.");
    }

    const inputPath = file.path;
    const outputDir = path.join(__dirname, "..", "compressed");
    const outputPath = path.join(outputDir, `${file.filename}-split.pdf`);

    // Read and split PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newDoc = await PDFDocument.create();

    if (splitPage < 1 || splitPage > pdfDoc.getPageCount()) {
      return res.status(400).send("Invalid split page number.");
    }

    const [copiedPage] = await newDoc.copyPages(pdfDoc, [splitPage - 1]);
    newDoc.addPage(copiedPage);

    const newPdfBytes = await newDoc.save();
    fs.writeFileSync(outputPath, newPdfBytes);

    res.download(outputPath, "split.pdf", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Split file download failed.");
      } else {
        fs.unlink(file.path, () => {});
        fs.unlink(outputPath, () => {});
      }
    });
  } catch (err) {
    console.error("Split error:", err.message);
    res.status(500).send("PDF splitting failed.");
  }
};
