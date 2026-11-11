// Feature flags. Paused features keep their code; only the UI entry points are hidden.
export const FEATURES = {
  // Multiple portfolio versions per user. Paused: one portfolio per account for now.
  multiVersion: false,
  // Advertising. Off until ad code is added; turns on the consent banner when true.
  ads: false,
  // AI text suggestions. On only when an AI endpoint (Worker or Cloud Function) is configured.
  ai: Boolean(process.env.REACT_APP_AI_URL),
};
