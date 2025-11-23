// quoteData.js
module.exports = {
  logoPath: "./media/logo.png",
  header: {
    title: "QUOTE",
    attention: "Obama Last Name",
    company: "Barack Company",
    addressLines: ["Freedom Street", "Eagle State 12345"],
    date: "9 November 2025",
    quoteNumber: "Q12345",
    jobNumber: "J12345",
    pageTextTemplate: "{{current}} of {{total}}",
    companyInfoLines: [
      "Walpix Metal PTY LTD",
      "PO Box 232",
      "Subiaco WA 6904",
      "ABN: 98 645 637 010",
      "Phone: +61 402 342 173",
      "E-mail: sales@walpix.com.au",
    ],
  },

  project: {
    name: "Project Obamium - 100m * 100m",
    lines: [
      "Walpix to develop & create usable DXF/S for Pic Perf Artwork placement on sheets for client.",
      "Pic Perf Artwork: Provided by client.",
      "Budget price is based on information received.",
    ],
  },

  inclusions: [
    // one or more items; make as many rows as you want to test pagination
    {
      description: "100 metre golden Obamium (Obama Pyramid) perforated panel.\n Laced with obamium spheres and 15 Litres of Mountain Dew \n john wock \n rick riordan \n milhouse, house? i like apartments better than houses you know i think they make a good place to live",
      qty: 2,
      rate: "150 VBucks",
      amount: "300 VBucks",
    },
    // A lot of rows example (you can keep or remove these)
    ...Array.from({ length: 2 }).map((_, i) => ({
      description: `Extra line item ${i + 1} - longer description to test wrapping and pagination properly.`,
      qty: (i % 5) + 1,
      rate: `${100 + i} VBucks`,
      amount: `${(100 + i) * ((i % 5) + 1)} VBucks`,
    })),
  ],

  terms:
    "Quotation Terms & Conditions\n\n" +
    "1. Validity: This quote will remain valid for a week. After this time, the quoted amount will be subject to review.\n" +
    "2. Tax: Excludes GST otherwise stated.\n" +
    "3. Delays: Under no circumstance does Walpix take responsibility for delays in work due to outside circumstances or delays caused by incorrect or insufficient information received by the client.\n" +
    "4. Payment Terms: CASH accounts require 50% deposit to begin scope of work, the remaining 50% due at completion of works.\n" +
    "5. Contract Terms: Purchase Order or Contract to be provided before any works will commence & a construction program is committed to.\n" +
    "6. Variations/Modifications: No variation or modification of the above Terms & Conditions shall be effected unless made in writing and agreed by both parties.\n\n" +
    "To view our full T&C, please contact sales@walpix.com.au.",

  validTo: "12 November 2025",

  // layout options (tweak as needed)
  layout: {
    margin: 50,
    headerY: 40,
    projectY: 180,
    tableTopY: 300,
    rowHeight: 60,
    termsY: 430,
    footerValidToX: 620,
    footerValidToYOffset: 20,
  },
};
