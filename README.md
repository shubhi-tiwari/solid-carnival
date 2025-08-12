# Replicate Style Transfer — Next.js (Vercel-ready)

This project is a minimal Next.js app that lets users upload or capture an image,
send it to a serverless API route that proxies requests to Replicate's Predictions API,
polls until the prediction completes, and returns the stylized image URL.

## Quick deploy (recommended)
1. Create a new GitHub repository and upload these files (or `git init` locally and push).
2. On Vercel, create a new project from the GitHub repo.
3. In Vercel project settings → Environment Variables, add:
   - `REPLICATE_API_TOKEN` = **your Replicate API token**
4. Deploy. Open the site, upload/capture an image, choose a style, click *Stylize*.

## Important
- Do NOT put your Replicate API token in client-side code. Use the `REPLICATE_API_TOKEN` env var.
- Serverless functions may timeout for very long-running predictions. If you see timeouts,
  consider adding a `vercel.json` with larger function timeout or using a separate server.
