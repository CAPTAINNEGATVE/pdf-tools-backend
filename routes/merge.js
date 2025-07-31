const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs(filePaths, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);
}

module.exports = async function handleMerge(req, res) {
  try {
    const files = req.files;
    const tempPaths = files.map((f) => f.path);
    const outputFile = path.join(__dirname, '../compressed', `merged-${Date.now()}.pdf`);

    await mergePDFs(tempPaths, outputFile);

    res.download(outputFile, 'merged.pdf', (err) => {
      // Clean up
      tempPaths.forEach((f) => fs.unlink(f, () => {}));
      fs.unlink(outputFile, () => {});
      if (err) console.error('Download error:', err);
    });
  } catch (err) {
    console.error('Merge error:', err);
    res.status(500).send('Merging failed');
  }
};
