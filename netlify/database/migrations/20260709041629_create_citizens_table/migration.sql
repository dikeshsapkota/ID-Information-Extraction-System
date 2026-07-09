CREATE TABLE "citizens" (
	"id" serial PRIMARY KEY,
	"full_text" text NOT NULL,
	"name" text NOT NULL,
	"id_number" text NOT NULL,
	"dob" text NOT NULL,
	"gender" text DEFAULT 'Not detected' NOT NULL,
	"district" text DEFAULT 'Not detected' NOT NULL,
	"municipality" text DEFAULT 'Not detected' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
