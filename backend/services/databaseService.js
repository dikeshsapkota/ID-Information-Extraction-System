const db = require("../database");
const { CitizenFields } = require("./aiExtractor");

function saveCitizen(fullText, fields) {
  const validatedFields = CitizenFields.parse(fields);
  const stmt = db.prepare(`
    INSERT INTO citizens (
      full_text,
      name,
      id_number,
      dob,
      gender,
      district,
      municipality
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    fullText,
    validatedFields.name,
    validatedFields.id_number,
    validatedFields.dob,
    validatedFields.gender,
    validatedFields.district,
    validatedFields.municipality
  );
}

function listCitizens() {
  return db.prepare("SELECT * FROM citizens ORDER BY id DESC").all();
}

module.exports = { listCitizens, saveCitizen };
