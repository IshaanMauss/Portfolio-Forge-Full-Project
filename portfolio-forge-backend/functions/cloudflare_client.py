# functions/cloudflare_client.py (FINAL DEBUGGING VERSION)

import requests
from firebase_functions import params
import os

if os.environ.get("FUNCTIONS_EMULATOR") == "true":
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Running in emulator, loaded secrets from .env file.")

def generate_ai_content(prompt: str):
    api_key = ""
    account_id = ""

    if os.environ.get("FUNCTIONS_EMULATOR") == "true":
        api_key = os.getenv("CF_API_KEY")
        account_id = os.getenv("CF_ACCOUNT_ID")
    else:
        api_key = params.SecretParam("CF_API_KEY").value
        account_id = params.SecretParam("CF_ACCOUNT_ID").value

    print(f"--- DEBUG: Attempting to use Account ID: {account_id} ---")
    if not account_id or not api_key:
        print("❌ CRITICAL ERROR: Cloudflare secrets not found.")
        raise ValueError("A required secret key was not found. Check your .env file and ensure it is in the 'functions' directory.")

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"prompt": prompt}

    print(f"--- Calling Cloudflare API at endpoint: {url} ---")
    try:
        # We are adding a 25-second timeout to the request itself.
        # If this hangs, the function will error out here instead of waiting for 5 minutes.
        print("--- DEBUG: Making requests.post() call now... ---")
        response = requests.post(url, headers=headers, json=payload, timeout=25)
        print("--- DEBUG: requests.post() call completed. ---")

        response.raise_for_status()

        data = response.json()
        print("--- ✅ Successfully received response from Cloudflare AI. ---")
        return data.get("result", {}).get("response", "[AI did not provide a valid response]")

    except requests.exceptions.Timeout:
        print("❌ CRITICAL ERROR: The request to Cloudflare timed out after 25 seconds. This is a network issue or a problem with the Cloudflare API.")
        return "[AI SERVER ERROR]: Connection timed out."
    except requests.exceptions.ConnectionError as conn_err:
        print(f"❌ CRITICAL ERROR: A network connection error occurred. This could be a FIREWALL or PROXY issue.")
        print(f"    Error Details: {conn_err}")
        return f"[AI SERVER ERROR]: Connection failed. Check firewall or network settings."
    except requests.exceptions.HTTPError as http_err:
        print(f"❌ HTTP ERROR occurred: {http_err}")
        print(f"    Status Code: {http_err.response.status_code}")
        print(f"    Response Body: {http_err.response.text}")
        # Check for common authentication errors
        if http_err.response.status_code == 403 or http_err.response.status_code == 401:
            print("--- HINT: This is an authentication error. Please verify your CF_API_KEY and CF_ACCOUNT_ID in the .env file. ---")
        return f"[AI API Error on Server]: {http_err.response.text}"
    except Exception as e:
        print(f"❌ An unexpected error occurred in generate_ai_content: {e}")
        return f"[AI API Error on Server]: {e}"