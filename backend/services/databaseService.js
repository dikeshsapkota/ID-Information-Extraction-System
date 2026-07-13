const db = require("../database");
const { CitizenFields } = require("./aiExtractor");

function saveCitizen(fullText, fields, ownerId) {
  const validatedFields = CitizenFields.parse(fields);
  if (!ownerId) throw new Error("Authenticated owner is required");
  const stmt = db.prepare(`
    INSERT INTO citizens (
      full_text,
      owner_id,
      name,
      id_number,
      dob,
      gender,
      district,
      municipality
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    fullText,
    ownerId,
    validatedFields.name,
    validatedFields.id_number,
    validatedFields.dob,
    validatedFields.gender,
    validatedFields.district,
    validatedFields.municipality
  );
}

function listCitizens(ownerId, isAdmin = false) {
  const fields = `
    id, name, id_number, dob, gender, district, municipality, created_at
  `;
  if (isAdmin) {
    return db.prepare(`SELECT ${fields} FROM citizens ORDER BY id DESC`).all();
  }

  return db
    .prepare(`SELECT ${fields} FROM citizens WHERE owner_id = ? ORDER BY id DESC`)
    .all(ownerId);
}

module.exports = { listCitizens, saveCitizen };
