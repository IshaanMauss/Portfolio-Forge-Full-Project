import { auth } from '../firebase/config';

// Set REACT_APP_AI_URL to your Worker, e.g. https://portfolio-forge.<you>.workers.dev/api
const API_BASE_URL = process.env.REACT_APP_AI_URL || '/api_v2';

// Calls the AI backend. The user's Firebase ID token is sent so the server can
// verify who is asking and enforce per-user daily limits.
export async function getEnhancedText(type, payload) {
  let endpoint = '';
  let body = {};

  switch (type) {
    case 'bio':
      endpoint = '/enhance-bio';
      body = { bio: payload.bio };
      break;
    case 'project':
      endpoint = '/enhance-project';
      body = { project_info: `${payload.title} - ${payload.keywords}` };
      break;
    default:
      return { error: 'Invalid AI request type' };
  }

  try {
    const user = auth.currentUser;
    if (!user) return { error: 'Please sign in to use AI enhancement.' };
    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: data.error || `Request failed (${response.status}).` };
    }
    return data;
  } catch (error) {
    console.error(`AI request failed for type "${type}":`, error);
    return { error: 'Failed to reach the AI server.' };
  }
}
