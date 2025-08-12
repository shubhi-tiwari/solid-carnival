import { useState } from "react";

export default function Home() {
  const [contentImage, setContentImage] = useState(null);
  const [styleImage, setStyleImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const applyStyle = async () => {
    if (!contentImage || !styleImage) {
      alert("Please upload both content and style images!");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/apply-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentImage, style: styleImage }),
      });
      const data = await res.json();
      setResult(data.output);
    } catch (error) {
      console.error(error);
      alert("Error applying style");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Style Transfer</h1>
      <div>
        <label>
          Upload Content Image:
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, setContentImage)} />
        </label>
        {contentImage && <img src={contentImage} alt="Content" style={{ width: "100%", marginTop: 10 }} />}
      </div>
      <div>
        <label>
          Upload Style Image:
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, setStyleImage)} />
        </label>
        {styleImage && <img src={styleImage} alt="Style" style={{ width: "100%", marginTop: 10 }} />}
      </div>
      <button
        onClick={applyStyle}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          fontSize: 16,
          background: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Applying..." : "Apply Style"}
      </button>
      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>Result</h2>
          <img src={result} alt="Result" style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}
