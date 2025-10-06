// src/api/enhanceAPI.js (FINAL CORRECTED VERSION)

const API_BASE_URL = "/api_v2";

export async function getEnhancedText(type, payload) {
  let endpoint = '';
  let body = {};

  switch (type) {
    case 'bio':
      endpoint = '/enhance-bio';
      body = { bio: payload.bio }; // This now correctly uses the 'bio' text
      break;
    case 'project':
      endpoint = '/enhance-project';
      body = { project_info: `${payload.title} - ${payload.keywords}` };
      break;
    default:
      console.error("Unknown AI enhancement type:", type);
      return { error: 'Invalid AI request type' };
  }

  console.log("Sending to backend:", JSON.stringify(body));
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error calling Python AI API for type "${type}":`, error);
    return { error: 'Failed to get AI enhancement from the server.' };
  }
}