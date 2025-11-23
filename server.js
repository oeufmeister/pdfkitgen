const express = require("express");
const bodyParser = require("body-parser");
const generateQuotePdf = require("./pdfkitgen"); // your real generator
const app = express();
const path = require("path");
const fs = require("fs"); // you already have this in pdfkitgen, but add here too if missing


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // so form.html works

// ---------- Helpers ----------
function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.warn("Invalid JSON received for inclusions:", err.message);
    return fallback;
  }
}

function splitLines(raw) {
  if (!raw) return [];
  return raw.split("\n").map(l => l.trim()).filter(l => l !== "");
}

function sanitize(text) {
  if (!text) return "";
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

// ---------- Generate PDF from Form ----------
app.post("/generate", (req, res) => {
  const {
    attention,
    company,
    addressLines,
    date,
    quoteNumber,
    jobNumber,
    companyInfoLines,
    projectName,
    projectLines,
    inclusions,
    terms,
    validTo
  } = req.body;

  // header
  const header = {
    title: "QUOTE",
    attention: sanitize(attention),
    company: sanitize(company),
    addressLines: splitLines(addressLines).map(sanitize),
    date: sanitize(date),
    quoteNumber: sanitize(quoteNumber),
    jobNumber: sanitize(jobNumber),
    pageTextTemplate: "{{current}} of {{total}}",
    companyInfoLines: splitLines(companyInfoLines).map(sanitize),
  };

  // project
  const project = {
    name: sanitize(projectName),
    lines: splitLines(projectLines).map(sanitize),
  };

  // inclusions
  const parsedInclusions = safeJSONParse(inclusions, []);
  const cleanInclusions = parsedInclusions.map(item => ({
    description: sanitize(item.description),
    qty: Number(item.qty) || 0,
    rate: sanitize(item.rate),
    amount: sanitize(item.amount),
  }));

  const cleanTerms = sanitize(terms);
  const cleanValidTo = sanitize(validTo);

  // FINAL QUOTE DATA OBJECT
  const quoteData = {
    logoPath: "./media/logo.png",
    header,
    project,
    inclusions: cleanInclusions,
    terms: cleanTerms,
    validTo: cleanValidTo,

    layout: {
      margin: 50,
      headerY: 40,
      projectY: 180,
      tableTopY: 300,
      rowHeight: 60,
      termsY: 430,
      footerValidToX: 620,
    }
  };

  // Correct file path
  const outputPath = path.join(__dirname, "quote-output.pdf");

  // Generate PDF (correct arg order)
  generateQuotePdf(outputPath, quoteData);

  // Send file back to user
  res.setHeader("Content-Type", "application/pdf");
  const stream = fs.createReadStream(outputPath);
  stream.pipe(res);
});


// ---------- Start ----------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
