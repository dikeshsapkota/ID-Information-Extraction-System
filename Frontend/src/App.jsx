import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!image) {
      alert("Please choose ID image first");
      return;
    }

    const formData = new FormData();
    formData.append("idImage", image);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/extract-id",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
    } catch (error) {
      alert("Something went wrong");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI ID Information Extraction System</h1>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <button type="submit">
          {loading ? "Extracting..." : "Upload & Extract"}
        </button>
      </form>

      {result && (
        <div className="result">
          <h2>Extracted Details</h2>

          <p><strong>Name:</strong> {result.fields.name}</p>
          <p><strong>ID Number:</strong> {result.fields.id_number}</p>
          <p><strong>DOB:</strong> {result.fields.dob}</p>
          <p><strong>Gender:</strong> {result.fields.gender}</p>
          <p><strong>District:</strong> {result.fields.district}</p>
          <p><strong>Municipality:</strong> {result.fields.municipality}</p>

          <h3>Full OCR Text</h3>
          <pre>{result.extractedText}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
