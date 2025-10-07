# functions/cloudflare_client.py

import os
import requests
import firebase_admin
from firebase_functions import params

# --- FINAL CORRECTED LOGIC ---
# Initialization and secret loading is now global. This code runs only ONCE
# when the function instance starts, preventing any "Duplicate Parameter" errors.

# Initialize Firebase Admin SDK (safely)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Load secrets from Secret Manager (safely)
# These are now global variables.
CF_API_KEY = params.SecretParam("CF_API_KEY").value
CF_ACCOUNT_ID = params.SecretParam("CF_ACCOUNT_ID").value
# --- END OF CORRECTION ---


def generate_ai_content(prompt: str):
    """
    Generates AI content using the globally loaded secrets.
    This function no longer loads secrets, it just uses them.
    """
    if not CF_ACCOUNT_ID or not CF_API_KEY:
        print("❌ CRITICAL ERROR: Cloudflare secrets were not loaded at startup.")
        raise ValueError("A required secret key was not found.")

    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1"
    headers = {"Authorization": f"Bearer {CF_API_KEY}"}
    payload = {"prompt": prompt}

    try:
        print("--- Sending request to Cloudflare AI... ---")
        response = requests.post(url, headers=headers, json=payload, timeout=25)
        response.raise_for_status()
        data = response.json()
        print("--- ✅ Successfully received response from Cloudflare AI. ---")
        return data.get("result", {}).get("response", "[AI did not provide a valid response]")

    except requests.exceptions.Timeout:
        print("❌ CRITICAL ERROR: Request to Cloudflare timed out.")
        return "[AI SERVER ERROR]: Connection timed out."
    except requests.exceptions.HTTPError as http_err:
        print(f"❌ HTTP ERROR occurred: {http_err.response.text}")
        return f"[AI API Error on Server]: {http_err.response.text}"
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return "[AI SERVER ERROR]: An unknown error occurred."