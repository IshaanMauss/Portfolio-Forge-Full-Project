# ML API Backend

This backend uses Flask and Cloudflare AI to generate content for bios, hard skills, soft skills, hobbies, and project descriptions.

## Setup

1. Copy `.env.example` to `.env` and fill in your Cloudflare credentials.
2. Install dependencies: `pip install -r requirements.txt`
3. Run locally: `python main.py`
4. Deploy to Google Cloud Function with entry point `app`.
