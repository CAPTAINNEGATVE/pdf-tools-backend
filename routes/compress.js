const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function compressPDF(inputPath, outputBase, targetSizeKB) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../python/shrinkpdf.py');
    const finalOutputPath = `${outputBase}-compressed.pdf`;

    // Extra: Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    const python = spawn('python', [
      pythonScript,
      inputPath,
      outputBase,
      String(targetSizeKB),
    ]);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`stdout: ${data}`);
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
      if (code === 0) {
        if (fs.existsSync(finalOutputPath)) {
          const stats = fs.statSync(finalOutputPath);
          const sizeKB = Math.round(stats.size / 1024);
          console.log(`✅ Compression complete. Final size: ${sizeKB} KB`);
          resolve({ finalSize: sizeKB });
        } else {
          console.error('❌ Compression script ran, but no output file was created.');
          console.error('stderr:', stderrData);
          reject(new Error('Compression script failed to write output.'));
        }
      } else {
        console.error(`❌ Python script exited with code ${code}`);
        console.error('stderr:', stderrData);
        reject(new Error('Compression failed'));
      }
    });
  });
}

module.exports = compressPDF;
