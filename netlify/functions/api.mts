import type { Config } from "@netlify/functions";
import { timingSafeEqual } from "node:crypto";
import { desc } from "drizzle-orm";
import Tesseract from "tesseract.js";
import { join } from "node:path";
import { db } from "../../db/index.js";
import { citizens } from "../../db/schema.js";

type Fields = {
  name: string;
  id_number: string;
  dob: string;
  gender: string;
  district: string;
  municipality: string;
};

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });

function isAuthorized(req: Request) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  const authorization = req.headers.get("authorization") ?? "";
  const providedKey = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!configuredKey || !providedKey) return false;
  const configured = Buffer.from(configuredKey);
  const provided = Buffer.from(providedKey);
  return (
    configured.length === provided.length && timingSafeEqual(configured, provided)
  );
}

function extractFields(text: string): Fields {
  const idMatch = text.match(/\b\d{6,}\b/);
  const dobMatch = text.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
  const genderMatch = text.match(/\b(male|female|other)\b/i);
  const districtMatch = text.match(/district\s*[:\-]?\s*([A-Za-z ]+)/i);
  const municipalityMatch = text.match(/municipality\s*[:\-]?\s*([A-Za-z ]+)/i);

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let detectedName = "Not detected";
  for (let index = 0; index < lines.length; index += 1) {
    const labelMatch = lines[index].match(
      /^(?:full\s*name|name)\b\s*(?:[:;-]\s*)?(.*)$/i,
    );
    if (!labelMatch) continue;

    const candidate = labelMatch[1].trim() || lines[index + 1] || "";
    if (/^[A-Za-z][A-Za-z .'-]{2,}$/.test(candidate)) {
      detectedName = candidate;
      break;
    }
  }

  return {
    name: detectedName,
    id_number: idMatch ? idMatch[0] : "Not detected",
    dob: dobMatch ? dobMatch[0] : "Not detected",
    gender: genderMatch ? genderMatch[1] : "Not detected",
    district: districtMatch ? districtMatch[1].trim() : "Not detected",
    municipality: municipalityMatch ? municipalityMatch[1].trim() : "Not detected",
  };
}

async function extractId(req: Request) {
  const form = await req.formData();
  const file = form.get("idImage");

  if (!(file instanceof File)) {
    return json({ message: "Please upload an ID image." }, { status: 400 });
  }

  const image = Buffer.from(await file.arrayBuffer());
  const result = await Tesseract.recognize(image, "eng", {
    langPath: join(process.cwd(), "backend"),
  });
  const extractedText = result.data.text.trim();
  const fields = extractFields(extractedText);

  const [saved] = await db
    .insert(citizens)
    .values({
      fullText: extractedText,
      name: fields.name,
      idNumber: fields.id_number,
      dob: fields.dob,
      gender: fields.gender,
      district: fields.district,
      municipality: fields.municipality,
    })
    .returning({ id: citizens.id });

  return json({
    message: "ID extracted and saved successfully",
    databaseId: saved.id,
    extractedText,
    fields,
  });
}

async function listCitizens() {
  const rows = await db.select().from(citizens).orderBy(desc(citizens.id));
  return json(rows);
}

export default async (req: Request) => {
  const { pathname } = new URL(req.url);

  try {
    if (!process.env.ADMIN_ACCESS_KEY) {
      return json(
        { message: "Server access protection is not configured" },
        { status: 503 }
      );
    }

    if (!isAuthorized(req)) {
      return json({ message: "Invalid access key" }, { status: 401 });
    }

    if (req.method === "POST" && pathname === "/api/extract-id") {
      return await extractId(req);
    }

    if (req.method === "GET" && pathname === "/api/citizens") {
      return await listCitizens();
    }

    return json({ message: "Not found" }, { status: 404 });
  } catch (error) {
    console.error(error);
    return json({ message: "OCR extraction failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/*",
};
