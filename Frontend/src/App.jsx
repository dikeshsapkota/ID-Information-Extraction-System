import { useState } from "react";
import axios from "axios";
import "./App.css";
import nepalEmblem from "./images/Emblem_of_Nepal.svg";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

const FIELD_LABELS = {
  name: "Name",
  id_number: "Citizenship Number",
  dob: "Date of Birth",
  gender: "Gender",
  district: "District",
  municipality: "Municipality",
};

const DOCUMENT_LABELS = {
  national_id: "National Identity Card",
  citizenship: "Citizenship Certificate",
  unknown: "Government ID",
};

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!image) {
      alert("Please choose ID image first");
      return;
    }

    const formData = new FormData();
    formData.append("idImage", image);
    setErrorMessage("");
    setSavedId(null);

    try {
      if (!API_URL) {
        throw new Error(
          "Missing VITE_API_URL. Add your Render backend URL in Netlify environment variables and redeploy."
        );
      }

      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/extract-id`,
        formData,
        {
          timeout: 120000,
        }
      );

      setResult(res.data);
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        (error.code === "ECONNABORTED"
          ? "Extraction timed out. Please try again with a smaller, clearer image."
          : error.code === "ERR_NETWORK"
            ? "Cannot reach the extraction server. Wait a moment and try again."
            : error.message || "Something went wrong");

      setErrorMessage(message);
      alert(message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setResult((current) => ({
      ...current,
      fields: { ...current.fields, [field]: value },
    }));
    setSavedId(null);
  };

  const handleSave = async () => {
    setErrorMessage("");
    setSaving(true);

    try {
      const res = await axios.post(`${API_URL}/api/citizens`, {
        extractedText: result.extractedText,
        fields: result.fields,
      });
      setSavedId(res.data.databaseId);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Unable to save record"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="government-panel">
        <header className="official-header">
          <img
            className="government-logo"
            src={nepalEmblem}
            alt="Government of Nepal emblem"
          />
          <div className="header-copy">
            <p className="kicker">Government of Nepal</p>
            <h1>National ID Information Extraction</h1>
            <p className="subtitle">Digital citizen record processing portal</p>
          </div>
        </header>

        <form className="upload-form" onSubmit={handleUpload}>
          <label className="file-control">
            <span>ID document image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Extracting..." : "Upload & Extract"}
          </button>
        </form>

        {errorMessage && <p className="error">{errorMessage}</p>}

        {result && (
          <section className="result">
            <h2>Review Extracted Details</h2>
            <p className="document-type">
              {DOCUMENT_LABELS[result.documentType] || DOCUMENT_LABELS.unknown}
            </p>
            <p className="review-note">
              Verify and edit every field before saving the citizen record.
            </p>
            {result.warning && <p className="warning">{result.warning}</p>}

            <div className="details-grid">
              {Object.entries(FIELD_LABELS).map(([field, label]) => (
                <label key={field}>
                  <strong>{label}</strong>
                  <input
                    type="text"
                    value={result.fields[field]}
                    onChange={(event) =>
                      handleFieldChange(field, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Confirm & Save"}
            </button>

            {savedId && (
              <p className="success">Record saved with database ID {savedId}.</p>
            )}

            <h3>Full OCR Text</h3>
            <pre>{result.extractedText}</pre>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
