const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractFieldsFromOcr,
  extractNepaliIdFields,
} = require("../services/aiExtractor");

test("extracts citizenship fields from English OCR labels", () => {
  const result = extractFieldsFromOcr(`
    Citizenship Certificate No: 04-02-79-01028
    Full Name: DIKESH SAPKOTA
    Date of Birth (AD): Year 2005 Month FEB Day 22
    Sex: Male
    Permanent Address: District: Jhapa Municipality: Damak Ward No. 2
  `);

  assert.deepEqual(result, {
    document_type: "citizenship",
    fields: {
      name: "DIKESH SAPKOTA",
      id_number: "04-02-79-01028",
      dob: "2005 Month FEB Day 22",
      gender: "Male",
      district: "Jhapa",
      municipality: "Damak",
    },
  });
});

test("normalizes Devanagari digits in national identification numbers", () => {
  const result = extractFieldsFromOcr(`
    NATIONAL IDENTITY CARD
    Full Name: Example Person
    NIN: १२३४ ५६७८ ९०
    Date of Birth: 2000-01-02
    Gender: Male
  `);

  assert.equal(result.document_type, "national_id");
  assert.equal(result.fields.id_number, "1234 5678 90");
  assert.equal(result.fields.name, "Example Person");
});

test("extracts national ID address from the compact card format", () => {
  const result = extractFieldsFromOcr(`
    Damak Municipality-2 Jhapa
    NATIONAL IDENTITY CARD
    NATIONALITY National Identification Number NIN
    Nepali ९४८-७४१-५४५२
    Date of Birth: 2005-02-22
  `);

  assert.equal(result.fields.id_number, "948-741-5452");
  assert.equal(result.fields.district, "Jhapa");
  assert.equal(result.fields.municipality, "Damak");
  assert.equal(result.fields.name, "Not detected");
});

test("does not treat uppercase document labels as a person's name", () => {
  const result = extractFieldsFromOcr(`
    NATIONAL IDENTITY CARD
    DATE OF BIRTH CARD HOLDER SIGNATURE
  `);

  assert.equal(result.fields.name, "Not detected");
});

test("uses OCR fallback when OpenAI is not configured", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const result = await extractNepaliIdFields(
      "Citizenship Certificate No: 04-02-79-01028",
      "/path/that/does/not/need/to/exist.jpeg"
    );

    assert.equal(result.extraction_method, "ocr_fallback");
    assert.equal(result.fields.id_number, "04-02-79-01028");
    assert.match(result.warning, /OPENAI_API_KEY/);
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});
