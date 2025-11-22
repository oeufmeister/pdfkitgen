// pdfkitgen.js
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const data = require("./quoteData");

// Small helper to format numbers or safe text
const safeText = (v) => (v === undefined || v === null ? "" : String(v));

function generateQuotePdf(outputPath, data) {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    bufferPages: true,
    margin: data.layout.margin || 50,
  });

  doc.pipe(fs.createWriteStream(outputPath));

  // page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = data.layout.margin;

  // reusable coordinates
  const leftX = margin;
  const rightX = pageWidth - margin - 500; // right block starting point
  const tableLeft = leftX;
  const tableWidth = pageWidth - margin * 2;
  const tableRightCols = {
    qtyX: tableLeft + Math.round(tableWidth * 0.55),
    rateX: tableLeft + Math.round(tableWidth * 0.72),
    amountX: tableLeft + Math.round(tableWidth * 0.85),
  };

  // draw header function
  function drawHeader() {
    // Title
    doc.font("Helvetica-Bold").fontSize(36).text(data.header.title, leftX, data.layout.headerY);

    // Left block
    let y = data.layout.headerY + 70;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(`Attention: `, leftX, y, { continued: true});
    doc.font("Helvetica").fontSize(10);
    doc.text(safeText(data.header.attention), leftX, y)
    y += 14;
    doc.text(safeText(data.header.company), leftX, y);
    y += 14;
    (data.header.addressLines || []).forEach((line) => {
      doc.text(line, leftX, y);
      y += 12;
    });

    // Right block (meta)
    let ry = data.layout.headerY + 70;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Date: `, rightX, ry, { continued: true});
    doc.fontSize(10).font("Helvetica");
    doc.text(safeText(data.header.date), rightX, ry);
    ry += 12;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Quote Number: `, rightX, ry, { continued: true});
    doc.fontSize(10).font("Helvetica");
    doc.text(safeText(data.header.quoteNumber), rightX, ry);
    ry += 12;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Job Number: `, rightX, ry, { continued: true});
    doc.fontSize(10).font("Helvetica");
    doc.text(safeText(data.header.jobNumber), rightX, ry);

    // Right-most company info stacked (further right)
    const companyX = pageWidth - margin - 200;
    let cy = data.layout.headerY + 80;
    doc.fontSize(9);
    (data.header.companyInfoLines || []).forEach((line) => {
      doc.text(line, companyX, cy, { width: 200, align: "right" });
      cy += 12;
    });

    // Try to draw logo if exists
    if (data.logoPath && fs.existsSync(data.logoPath)) {
      // scale to fit max width 100
      try {
        doc.image(data.logoPath, pageWidth - margin - 70, data.layout.headerY, {
          width: 80,
        });
      } catch (err) {
        // ignore if image can't load
      }
    }
  }

  // draw project section
  function drawProject() {
    doc.font("Helvetica-Bold").fontSize(14).text(data.project.name, leftX, data.layout.projectY);
    doc.font("Helvetica").fontSize(10);
    let py = data.layout.projectY + 18;
    (data.project.lines || []).forEach((line) => {
      doc.text(line, leftX, py, { width: pageWidth - margin * 2 - 200 });
      py += 12;
    });
  }

  // table header (drawn on each page)
  function drawTableHeader(y) {
    // shaded header boxes
    const headerH = 30;
    doc.save();
    doc.rect(tableLeft, y, tableWidth * 0.55, headerH).fillAndStroke("#e9e9e9", "#bfbfbf");
    doc.rect(tableLeft + tableWidth * 0.55, y, tableWidth * 0.17, headerH).fillAndStroke(
      "#e9e9e9",
      "#bfbfbf"
    );
    doc.rect(tableLeft + tableWidth * 0.72, y, tableWidth * 0.13, headerH).fillAndStroke(
      "#e9e9e9",
      "#bfbfbf"
    );
    doc.rect(tableLeft + tableWidth * 0.85, y, tableWidth * 0.15, headerH).fillAndStroke(
      "#e9e9e9",
      "#bfbfbf"
    );
    doc.restore();

    doc.fillColor("black").font("Helvetica-Bold").fontSize(12);
    doc.text("Inclusions", tableLeft + 10, y + 8);
    doc.text("Quantity", tableLeft + tableWidth * 0.55 + 10, y + 8);
    doc.text("Rate", tableLeft + tableWidth * 0.72 + 10, y + 8);
    doc.text("Amount", tableLeft + tableWidth * 0.85 + 10, y + 8);
  }

  // Draw a single table row; returns new Y
  function drawTableRow(item, y) {
    const padding = 8;
    const descriptionWidth = tableWidth * 0.55 - padding * 2;
    const descHeight = doc.heightOfString(item.description, {
      width: descriptionWidth,
      align: "left",
    });

    const rowHeight = Math.max(descHeight + padding * 2, data.layout.rowHeight);

    // If row would exceed page usable area, return null to signal caller to create new page
    const usableBottom = pageHeight - margin - 80; // leave room for terms/valid-to
    if (y + rowHeight > usableBottom) {
      return null;
    }

    // Draw row borders
    doc.rect(tableLeft, y, tableWidth * 0.55, rowHeight).stroke();
    doc.rect(tableLeft + tableWidth * 0.55, y, tableWidth * 0.17, rowHeight).stroke();
    doc.rect(tableLeft + tableWidth * 0.72, y, tableWidth * 0.13, rowHeight).stroke();
    doc.rect(tableLeft + tableWidth * 0.85, y, tableWidth * 0.15, rowHeight).stroke();

    // Fill text
    doc.font("Helvetica").fontSize(10);
    doc.text(item.description, tableLeft + padding, y + padding, {
      width: descriptionWidth,
      align: "left",
    });
    doc.text(String(item.qty), tableLeft + tableWidth * 0.55 + 10, y + padding);
    doc.text(item.rate, tableLeft + tableWidth * 0.72 + 10, y + padding);
    doc.text(item.amount, tableLeft + tableWidth * 0.85 + 10, y + padding);

    return y + rowHeight;
  }

  // draw terms & footer (ensures it fits on current page or creates new page)
  function drawTermsAndFooter(currentY) {
    const termsX = leftX;
    const termsWidth = tableWidth * 0.7;
    const usableBottom = pageHeight - margin - 60;

    const termsHeight = doc.heightOfString(data.terms, {
      width: termsWidth,
    }) + 20;

    // If terms would exceed usable area, make a new page and draw there
    if (currentY + termsHeight + 60 > usableBottom) {
      doc.addPage();
      drawHeader();
      drawProject();
      // Put terms near top of new page
      const newTermsY = data.layout.headerY + 220;
      doc.font("Helvetica").fontSize(9).text(data.terms, termsX, newTermsY, { width: termsWidth });
      // Valid to at fixed bottom area of page
      doc.font("Helvetica-Bold").fontSize(12).text(
        `Valid to: ${data.validTo}`,
        data.layout.footerValidToX,
        pageHeight - margin - 30
      );
      return;
    }

    // Otherwise draw terms below currentY
    const termsY = Math.max(currentY + 20, data.layout.termsY);
    doc.font("Helvetica").fontSize(9).text(data.terms, termsX, termsY, { width: termsWidth });

    // Place Valid to in a fixed position relative to bottom margin (safe)
    doc.font("Helvetica-Bold").fontSize(12).text(
      `Valid to: ${data.validTo}`,
      data.layout.footerValidToX,
      pageHeight - margin - 30
    );
  }

  function addPageNumbers(doc, template, x, y) {
  const range = doc.bufferedPageRange();
  const total = range.count;

    for (let i = 0; i < total; i++) {
        doc.switchToPage(i);

        const text = template
        .replace("{{current}}", i + 1)
        .replace("{{total}}", total);
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text(`Page: `, x, y, { continued: true});
        doc.fontSize(10).font("Helvetica");
        doc.text(text, x, y);
    }
  }



  // Start page and draw everything with pagination support for table rows
  drawHeader();
  drawProject();
  drawTableHeader(data.layout.tableTopY);

  let currentY = data.layout.tableTopY + 30; // start below table header

  for (let i = 0; i < (data.inclusions || []).length; i++) {
    const item = data.inclusions[i];
    const nextY = drawTableRow(item, currentY);

    if (nextY === null) {
      // need new page
      doc.addPage();
      drawHeader();
      drawProject();
      drawTableHeader(data.layout.headerY + 220); // new table header y on new page (tweak as needed)
      currentY = data.layout.headerY + 220 + 30;
      // try again
      const tried = drawTableRow(item, currentY);
      if (tried === null) {
        // extremely large single row blank out with a forced page (shouldn't happen usually)
        doc.addPage();
        drawHeader();
        drawProject();
        drawTableHeader(data.layout.headerY + 220);

        currentY = data.layout.headerY + 220 + 30;
        const finalTry = drawTableRow(item, currentY);
        if (finalTry === null) {
          // give up and skip
          currentY += data.layout.rowHeight;
        } else currentY = finalTry;
      } else {
        currentY = tried;
      }
    } else {
      currentY = nextY;
    }
  }
  const pageY = data.layout.headerY + 106;
  
  // After table rows drawn, draw terms & footer (handles its own pagination)
  drawTermsAndFooter(currentY);
  addPageNumbers(doc, data.header.pageTextTemplate, rightX, pageY);
  doc.end();
}

// Run generator
const OUTPUT = path.join(__dirname, "quote-output.pdf");
generateIfMain();

function generateIfMain() {
  // quick validation
  if (!data) {
    console.error("Missing data (quoteData.js).");
    process.exit(1);
  }
  console.log("Generating PDF:", OUTPUT);
  generateQuotePdf(OUTPUT, data);
  console.log("Done — check", OUTPUT);
}
