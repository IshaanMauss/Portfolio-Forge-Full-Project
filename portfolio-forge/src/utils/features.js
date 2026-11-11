// Feature flags. Paused features keep their code; only the UI entry points are hidden.
export const FEATURES = {
  // Multiple portfolio versions per user. Paused: one portfolio per account for now.
  multiVersion: false,
  // Advertising. Off until ad code is added; turns on the consent banner when true.
  ads: false,
};
