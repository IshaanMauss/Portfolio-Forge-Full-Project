# functions/main.py

from firebase_functions import https_fn, options
import json
from cloudflare_client import generate_ai_content

options.set_global_options(timeout_sec=120, region="us-central1")

@https_fn.on_request()
def api_v2(req: https_fn.Request) -> https_fn.Response:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    if req.method == "OPTIONS":
        return https_fn.Response(status=204, headers=cors_headers)

    # --- YEH LINE CHANGE KI GAYI HAI ---
    # Hum '/api_v2/' ko path se hata rahe hain taaki saaf endpoint mile
    path = req.path.replace('/api_v2/', '', 1).strip('/')
    # --- CHANGE KHATAM ---

    if path == 'enhance-bio':
        return handle_enhance_bio(req, cors_headers)
    elif path == 'enhance-project':
        return handle_enhance_project(req, cors_headers)
    else:
        # User ko behtar error message dikhao
        error_message = f"Endpoint '{path}' not found."
        return https_fn.Response(json.dumps({"error": error_message}), status=404, headers=cors_headers, mimetype="application/json")

def handle_enhance_bio(req: https_fn.Request, headers: dict):
    try:
        data = req.get_json()
        bio_text = data.get('bio')
        
        if not bio_text or len(bio_text) > 1500:
            return https_fn.Response('{"error":"Bio text is required and must be less than 1500 characters"}', status=400, headers=headers, mimetype="application/json")

        prompt = f"Rewrite and enhance the following professional bio for a tech portfolio. Make it sound professional and engaging. Do not add a 'Title:' or any other prefix .Also definitely not more than 80 words  Bio: \\\"{bio_text}\\\"\""
        enhanced_text = generate_ai_content(prompt)
        response_data = json.dumps({'enhancedText': enhanced_text})
        return https_fn.Response(response_data, status=200, headers=headers, mimetype="application/json")
    except Exception as e:
        print(f"An error occurred in handle_enhance_bio: {e}")
        return https_fn.Response('{"error":"Something went wrong on the server"}', status=500, headers=headers, mimetype="application/json")

def handle_enhance_project(req: https_fn.Request, headers: dict):
    try:
        data = req.get_json()
        project_info = data.get('project_info')

        if not project_info or len(project_info) > 1500:
            return https_fn.Response('{"error":"Project info is required and must be less than 1500 characters"}', status=400, headers=headers, mimetype="application/json")

        prompt = f"Generate a professional project description for a tech portfolio based on these keywords: '{project_info}'. The description should be in 2-3 sentences long &  definitely not more than 45 words . Do not add a 'Title:' or any other prefix."
        enhanced_text = generate_ai_content(prompt)
        response_data = json.dumps({'enhancedText': enhanced_text})
        return https_fn.Response(response_data, status=200, headers=headers, mimetype="application/json")
    except Exception as e:
        print(f"An error occurred in handle_enhance_project: {e}")
        return https_fn.Response('{"error":"Something went wrong on the server"}', status=500, headers=headers, mimetype="application/json")