import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [imageBlob, setImageBlob] = useState(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [stylizedUrl, setStylizedUrl] = useState('')
  const [status, setStatus] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const styles = [
    { id: 'vangogh', name: 'Van Gogh', url: 'https://replicate.delivery/pbxt/NXSwPUSUn1LpQQAgMG_iq63W1KW6DJzE_tUdvhynDbRJoYps6ny6KKbR3BpZUXU5i-GSiPCP3rKM0efqtKHCVEKq9TwIMDDmLzquK7TYxq4-QLt8wlUdKHTuTw4eKONf/van-gogh.jpeg' },
    { id: 'monet', name: 'Claude Monet', url: 'https://replicate.delivery/pbxt/E3Q2Dy5W3ZKX1-nmDy7zv-BW9b1oxzSXx8s9ukb2OY5sxFQXvW0VGxjl8mWjOtF7FchvOWSe-hUe6K7h52WY7BoQ0qmoV5-WQqfPlf4idIbBzLMgJg8h0RmQbLHHUq6/claude-monet.jpeg' },
    { id: 'cezanne', name: 'Paul Cézanne', url: 'https://replicate.delivery/pbxt/yMaYlHbRj69CUd6YFfhqf3OWNIkUGrdp3HO-qa1VZmSMi-TXfjTmVfJXUgiM9Kq9EsY7ky7pH42-HJXKw31h_xW7ggdeSo63zzurjXjFRvtxV96yS5y78uHKyRlfnSTlk/paul-cezanne.jpeg' },
    { id: 'pollock', name: 'Jackson Pollock', url: 'https://replicate.delivery/pbxt/-nMZtUVkgH5lE1RtgQL5aW9J7-nq0mZ6e7V0HZ83apW1AdzDvjydPkYbEQLQ4yF8bV03Mo2HkwxIo-3pCGvIScGi-zNrSnAn9JKPMQhYty6SqpDrjoLjMLejLCrGHFnhY/jackson-pollock.jpeg' },
    { id: 'matisse', name: 'Henri Matisse', url: 'https://replicate.delivery/pbxt/ANkYPpH6R79kqCpAwAJKEmr_jw8qTjuu6qThjEX3WRHjw5TVnT4YNlAZFcpjlwIcIbp6z5qFkNn9MGc8jlGUCpAdOaOD9Wds8SzNAxsxA8XP_-fZhWvUkpQ2P9Scnzxg/henri-matisse.jpeg' },
  ]

  const [selectedStyle, setSelectedStyle] = useState(styles[0].url)

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (stylizedUrl) URL.revokeObjectURL(stylizedUrl)
    }
  }, [originalUrl, stylizedUrl])

  async function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setStylizedUrl('')
    setStatus('')
    setImageBlob(f)
    const url = URL.createObjectURL(f)
    setOriginalUrl(url)
  }

  async function openCamera() {
    if (cameraOn) { stopCamera(); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = s
      videoRef.current.srcObject = s
      videoRef.current.play()
      setCameraOn(true)
      setStatus('Camera is on — capture when ready.')
    } catch (err) {
      setStatus('Could not open camera: ' + err.message)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
    setStatus('')
  }

  function captureSnapshot() {
    if (!videoRef.current) return
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth || 640
    canvas.height = v.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      setImageBlob(blob)
      setStylizedUrl('')
      setStatus('Snapshot captured')
      const url = URL.createObjectURL(blob)
      setOriginalUrl(url)
    }, 'image/png')
  }

  function readBlobAsDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function handleStylize() {
    if (!imageBlob) { alert('Please upload or capture an image first.'); return }
    setIsProcessing(true)
    setStatus('Preparing image...')
    setStylizedUrl('')

    try {
      const dataUrl = await readBlobAsDataURL(imageBlob)
      setStatus('Uploading to server...')
      const resp = await fetch('/api/stylize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, style: selectedStyle })
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || 'Server error')
      }
      const json = await resp.json()
      if (json.output) {
        setStylizedUrl(json.output)
        setStatus('Stylization complete!')
      } else {
        throw new Error('No output from server')
      }
    } catch (err) {
      setStatus('Error: ' + (err.message || err))
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadResult() {
    if (!stylizedUrl) return
    const a = document.createElement('a')
    a.href = stylizedUrl
    a.download = 'stylized.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="page-root">
      <header className="site-header">
        <h1>Replicate Style Transfer</h1>
        <p className="tagline">Upload or capture — choose a style — stylize — download</p>
      </header>

      <main className="container">
        <section className="panel controls">
          <label className="file-btn">
            Choose Image
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} />
          </label>

          <div className="cam-controls">
            <button className="btn ghost" onClick={openCamera}>{cameraOn ? 'Close Camera' : 'Open Camera'}</button>
            <button className="btn ghost" onClick={captureSnapshot} disabled={!cameraOn}>Capture</button>
          </div>

          <select className="select" value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)}>
            {styles.map(s => <option key={s.id} value={s.url}>{s.name}</option>)}
          </select>

          <button className="btn primary" onClick={handleStylize} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Stylize'}</button>
        </section>

        <section className="panel" id="cameraPanel" style={{ display: cameraOn ? 'block' : 'none' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ maxWidth: '100%', borderRadius: 10 }} />
        </section>

        <section className="preview-row">
          <div>
            <h3>Original</h3>
            <div className="media-wrap">
              {originalUrl ? <img src={originalUrl} alt="original" className="media" /> : <div className="placeholder">No image yet</div>}
            </div>
          </div>

          <div>
            <h3>Stylized</h3>
            <div className="media-wrap">
              {stylizedUrl ? <img src={stylizedUrl} alt="stylized" className="media" /> : <div className="placeholder">No stylized image yet</div>}
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={downloadResult} disabled={!stylizedUrl}>Download</button>
            </div>
          </div>
        </section>

        <div className="status">{status}</div>
      </main>

      <footer className="site-footer">Deploy on Vercel • Set <code>REPLICATE_API_TOKEN</code> env var</footer>

      <style jsx>{`
        :root{ --accent:#7c3aed; --muted:#6b7280; --card:#fff; }
        .page-root{ min-height:100vh; display:flex; flex-direction:column; background:linear-gradient(180deg,#f7fafc,#eef2ff); color:#111827; }
        .site-header{ background:linear-gradient(90deg,#7c3aed,#06b6d4); color:#fff; padding:20px; text-align:center }
        .site-header h1{ margin:0; font-size:clamp(1.2rem, 2.5vw, 2rem) }
        .tagline{ margin-top:6px; opacity:0.95 }
        .container{ max-width:1100px; margin:18px auto; padding:12px; flex:1 }
        .panel{ background:var(--card); border-radius:12px; padding:16px; box-shadow:0 6px 18px rgba(16,24,40,0.06); margin-bottom:12px }
        .controls{ display:flex; flex-wrap:wrap; gap:12px; align-items:center }
        .file-btn{ background:#111827; color:#fff; padding:10px 14px; border-radius:8px; position:relative; overflow:hidden }
        .file-btn input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer }
        .btn{ padding:10px 14px; border-radius:8px; border:none; background:#e5e7eb; cursor:pointer }
        .btn.primary{ background:var(--accent); color:#fff }
        .btn.ghost{ background:transparent; border:1px solid #e6e6e6 }
        .select{ padding:10px; border-radius:8px; border:1px solid #e6e6e6; min-width:180px }
        .preview-row{ display:grid; grid-template-columns:1fr 1fr; gap:16px }
        .media{ width:100%; height:auto; border-radius:10px; border:1px solid #e6e6e6; object-fit:contain }
        .placeholder{ min-height:220px; display:flex; align-items:center; justify-content:center; color:var(--muted); background:#f8fafc; border-radius:8px; border:1px dashed #e6e6e6 }
        .status{ margin-top:8px; color:var(--muted) }
        .site-footer{ text-align:center; padding:12px; color:var(--muted) }
        @media (max-width:800px){
          .preview-row{ grid-template-columns:1fr }
          .controls{ flex-direction:column; align-items:stretch }
          .select, .btn, .file-btn{ width:100% }
        }
      `}</style>
    </div>
  )
}

