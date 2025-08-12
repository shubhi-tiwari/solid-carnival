// pages/api/stylize.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { image, style } = req.body;
  if (!image || !style) return res.status(400).json({ error: "Missing image or style" });

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/maze/FastStyleTransfer",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: { image: image, style_image: style } }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API Error: ${errorText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");
    const outputDataUrl = `data:image/jpeg;base64,${base64}`;

    return res.status(200).json({ output: outputDataUrl });
  } catch (err) {
    console.error("Error calling HF API:", err);
    return res.status(500).json({ error: err.message });
  }
}
