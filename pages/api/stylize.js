// pages/api/stylize.js
export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { image, style } = req.body;
  if (!image || !style) {
    return res.status(400).json({ error: "Content or style image missing" });
  }

  try {
    const hfResp = await fetch(
      "https://georgescutelnicu-neural-style-transfer.hf.space/run/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [image, style] }),
      }
    );

    if (!hfResp.ok) {
      throw new Error(`Space API error: ${await hfResp.text()}`);
    }

    const result = await hfResp.json();
    const outputUrl = result.data[0]; // Gradio Space returns an array with the image data

    res.status(200).json({ output: outputUrl });
  } catch (err) {
    console.error("Stylize handler error:", err);
    res.status(500).json({ error: err.message });
  }
}
