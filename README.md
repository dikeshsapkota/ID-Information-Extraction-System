# AI Government ID Information Extraction System

An AI-powered full-stack web application that extracts structured information from government-issued identity documents using Optical Character Recognition (OCR) and stores the extracted data securely in a backend database.

---

## Overview

The AI Government ID Information Extraction System automates the process of extracting information from identity documents such as citizenship certificates. Instead of manually entering citizen information, users upload an image of an ID document. The system processes the image using OCR, extracts relevant information, and stores the structured data in a database.

This project demonstrates full-stack web development, REST API integration, OCR processing, backend development, and AI-assisted document analysis.

---

## Sample Preview

![AI Government ID Information Extraction System sample interface](docs/images/sample-frontend.png)

---

## Features

- Upload government-issued identity documents
- OCR-based text extraction using Tesseract.js
- AI-assisted field extraction
- Automatic detection of:
  - Full Name
  - Citizenship Number
  - Date of Birth
  - Gender
  - District
  - Municipality
- Secure database storage
- RESTful API architecture
- Responsive React frontend
- Backend validation and processing

---

## System Architecture

```text
                 React Frontend
                        |
                        v
                  Axios HTTP Client
                        |
                        v
                 Express.js Backend
                        |
        +---------------+---------------+
        v                               v
   Multer File Upload             SQLite Database
        |
        v
   Tesseract OCR Engine
        |
        v
 AI-assisted Data Extraction
        |
        v
 Structured Citizen Information
```

---

## Technology Stack

### Frontend

- React
- Vite
- Axios
- CSS

### Backend

- Node.js
- Express.js
- Multer
- Tesseract.js

### Database

- SQLite

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Netlify
- Render

---

## Project Structure

```text
ID-Information-Extraction-System/

├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── uploads/
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/dikeshsapkota/ID-Information-Extraction-System.git

cd ID-Information-Extraction-System
```

---

### Frontend

```bash
cd Frontend

npm install

npm run dev
```

Runs on:

```text
http://localhost:5173
```

---

### Backend

```bash
cd backend

npm install

npm run dev
```

Runs on:

```text
http://localhost:5000
```

---

## API Endpoints

### Extract ID Information

```http
POST /api/extract-id
```

Uploads an identity document and returns structured extracted information.

---

### Retrieve Citizens

```http
GET /api/citizens
```

Returns all stored citizen records.

---

### Health Check

```http
GET /api/health
```

Returns the current backend service status.

---

## Application Workflow

```text
Upload Identity Document
            |
            v
 OCR Text Extraction
            |
            v
 AI-assisted Data Parsing
            |
            v
 Structured Information
            |
            v
 User Review
            |
            v
 Database Storage
            |
            v
 Record Management
```

---

## Current Functionality

- Government ID upload
- OCR text extraction
- AI-assisted field detection
- Structured data processing
- Database storage
- REST API
- React frontend
- Backend validation

---

## Future Enhancements

- JWT Authentication
- Role-Based Access Control
- Admin Dashboard
- Search and Filtering
- Edit and Delete Records
- Multiple Document Support
- Passport Recognition
- Driving License Recognition
- National ID Recognition
- Confidence Scoring
- AI-powered Structured Extraction
- Image Preprocessing
- Face Verification
- PostgreSQL Integration
- Cloud Storage
- Audit Logs
- PDF Report Generation
- Analytics Dashboard

---

## Deployment

### Frontend

Netlify

### Backend

Render

---

## Challenges

- OCR accuracy depends on image quality.
- Different document layouts require flexible extraction logic.
- AI-assisted parsing improves extraction reliability compared to fixed regular expressions.
- Secure handling of uploaded identity documents is essential.

---

## Future Scope

The project is intended to evolve into a comprehensive government-style identity verification platform capable of supporting multiple document types, intelligent document classification, AI-powered field extraction, administrative management, authentication, reporting, and cloud deployment.

---

## Author

**Dikesh Sapkota**

Bachelor of Science in Computer Science and Information Technology (BSc CSIT)

GitHub: https://github.com/dikeshsapkota

LinkedIn: https://www.linkedin.com/in/dikesh-sapkota-430831316/

---

## License

This project is licensed under the MIT License.
