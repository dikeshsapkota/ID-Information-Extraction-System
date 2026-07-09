import { useState } from "react";
import axios from "axios";
import "./App.css";
import nepalEmblem from "./images/Emblem_of_Nepal.svg";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
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
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";

      setErrorMessage(message);
      alert(message);
      console.log(error);
    } finally {
      setLoading(false);
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
              accept="image/*"
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
            <h2>Extracted Details</h2>

            <div className="details-grid">
              <p><strong>Name</strong><span>{result.fields.name}</span></p>
              <p><strong>ID Number</strong><span>{result.fields.id_number}</span></p>
              <p><strong>DOB</strong><span>{result.fields.dob}</span></p>
              <p><strong>Gender</strong><span>{result.fields.gender}</span></p>
              <p><strong>District</strong><span>{result.fields.district}</span></p>
              <p><strong>Municipality</strong><span>{result.fields.municipality}</span></p>
            </div>

            <h3>Full OCR Text</h3>
            <pre>{result.extractedText}</pre>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
