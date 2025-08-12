// pages/api/stylize.js
// Serverless function that proxies to Replicate Predictions API and polls for completion

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).send('Server misconfigured: missing REPLICATE_API_TOKEN')

  try {
    const { image, style } = req.body
    if (!image || !style) return res.status(400).send('Missing image or style')

    // Remove data url prefix if present
    const base64 = image.startsWith('data:') ? image.split(',')[1] : image

    // Build Replicate input depending on model version
    const version = '8e579174a98cd09caca7e7a99fa2aaf4eaef16daf2003a3862c1af05c1c531c8'

    // Create prediction
    const createResp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        version,
        input: {
          content_image: base64,
          style_image: style
        }
      })
    })

    if (!createResp.ok) {
      const text = await createResp.text()
      return res.status(502).send('Replicate create error: ' + text)
    }

    const prediction = await createResp.json()

    // Poll the prediction URL until the job is done
    const getUrl = prediction.urls?.get
    if (!getUrl) return res.status(500).send('No prediction URL returned')

    // Poll loop
    for (;;) {
      const pollResp = await fetch(getUrl, { headers: { 'Authorization': `Token ${token}` } })
      if (!pollResp.ok) {
        const t = await pollResp.text()
        return res.status(502).send('Replicate poll error: ' + t)
      }
      const json = await pollResp.json()
      if (json.status === 'succeeded') {
        // return first output (usually an image URL)
        return res.status(200).json({ output: json.output?.[0] || null })
      }
      if (json.status === 'failed') {
        return res.status(500).send('Prediction failed')
      }
      // still processing
      await new Promise(r => setTimeout(r, 1500))
    }
  } catch (err) {
    console.error(err)
    return res.status(500).send('Server error: ' + (err.message || err))
  }
}
