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
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeView, setActiveView] = useState("extract");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [citizens, setCitizens] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const getErrorMessage = (error, fallback) =>
    error.response?.data?.message ||
    error.response?.data?.error ||
    (error.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : error.code === "ERR_NETWORK"
        ? "Cannot reach the server. Wait a moment and try again."
        : error.message || fallback);

  const authorization = (key = accessKey) => ({
    Authorization: `Bearer ${key}`,
  });

  const handleUnlock = async (event) => {
    event.preventDefault();
    const candidateKey = accessKeyInput.trim();
    if (!candidateKey) {
      setAuthError("Enter the portal access key.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await axios.get(`${API_URL}/api/citizens`, {
        headers: authorization(candidateKey),
        timeout: 30000,
      });
      setAccessKey(candidateKey);
      setAccessKeyInput("");
      setCitizens(response.data);
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to unlock the portal"));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLock = () => {
    setAccessKey("");
    setAccessKeyInput("");
    setCitizens([]);
    setResult(null);
    setActiveView("extract");
  };

  const loadCitizens = async () => {
    setRecordsLoading(true);
    setRecordsError("");
    try {
      const response = await axios.get(`${API_URL}/api/citizens`, {
        headers: authorization(),
        timeout: 30000,
      });
      setCitizens(response.data);
    } catch (error) {
      setRecordsError(getErrorMessage(error, "Unable to load saved records"));
      if (error.response?.status === 401) handleLock();
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setErrorMessage("");
    if (view === "records") loadCitizens();
  };

  const formatSavedDate = (value) => {
    if (!value) return "Not available";
    const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

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
          headers: authorization(),
          timeout: 120000,
        }
      );

      setResult(res.data);
    } catch (error) {
      const message = getErrorMessage(error, "Something went wrong");

      setErrorMessage(message);
      if (error.response?.status === 401) handleLock();
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
      }, {
        headers: authorization(),
      });
      setSavedId(res.data.databaseId);
      await loadCitizens();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save record"));
      if (error.response?.status === 401) handleLock();
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

        {!accessKey ? (
          <form className="access-panel" onSubmit={handleUnlock}>
            <div>
              <h2>Secure Portal Access</h2>
              <p>Enter the server access key to continue.</p>
            </div>
            <label className="access-control">
              <span>Access key</span>
              <input
                type="password"
                autoComplete="current-password"
                value={accessKeyInput}
                onChange={(event) => setAccessKeyInput(event.target.value)}
              />
            </label>
            <button type="submit" disabled={authLoading}>
              {authLoading ? "Checking..." : "Unlock Portal"}
            </button>
            {authError && <p className="error access-error">{authError}</p>}
          </form>
        ) : (
          <>
            <nav className="workspace-nav" aria-label="Portal sections">
              <div className="view-tabs" role="tablist">
                <button
                  className="tab-button"
                  type="button"
                  role="tab"
                  aria-selected={activeView === "extract"}
                  onClick={() => handleViewChange("extract")}
                >
                  Extract ID
                </button>
                <button
                  className="tab-button"
                  type="button"
                  role="tab"
                  aria-selected={activeView === "records"}
                  onClick={() => handleViewChange("records")}
                >
                  Saved Records
                  <span className="record-count">{citizens.length}</span>
                </button>
              </div>
              <button className="lock-button" type="button" onClick={handleLock}>
                Lock
              </button>
            </nav>

            {activeView === "extract" && (
              <>
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
              </>
            )}

            {activeView === "records" && (
              <section className="records-view">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Citizen database</p>
                    <h2>Saved Records</h2>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={loadCitizens}
                    disabled={recordsLoading}
                  >
                    {recordsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {recordsError && <p className="error records-error">{recordsError}</p>}
                {!recordsLoading && !recordsError && citizens.length === 0 && (
                  <div className="empty-state">
                    <h3>No saved records</h3>
                    <p>Confirmed citizen records will appear here.</p>
                  </div>
                )}

                {citizens.length > 0 && (
                  <div className="records-table-wrap">
                    <table className="records-table">
                      <thead>
                        <tr>
                          <th scope="col">Record</th>
                          <th scope="col">Citizen</th>
                          <th scope="col">Document ID</th>
                          <th scope="col">Date of Birth</th>
                          <th scope="col">Gender</th>
                          <th scope="col">Address</th>
                          <th scope="col">Saved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citizens.map((citizen) => (
                          <tr key={citizen.id}>
                            <td className="record-id">#{citizen.id}</td>
                            <td className="citizen-name">{citizen.name}</td>
                            <td>{citizen.id_number ?? citizen.idNumber}</td>
                            <td>{citizen.dob}</td>
                            <td>{citizen.gender}</td>
                            <td>
                              {[citizen.municipality, citizen.district]
                                .filter((value) => value && value !== "Not detected")
                                .join(", ") || "Not detected"}
                            </td>
                            <td>
                              {formatSavedDate(citizen.created_at ?? citizen.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
