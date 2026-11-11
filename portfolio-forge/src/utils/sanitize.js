// Builds the PUBLIC copy of a portfolio version. Anything the owner has
// switched off (or that is private by nature) is removed here, so it never
// reaches the world-readable `published` collection.

const LIST_SECTIONS = [
  'hardSkills',
  'softSkills',
  'interests',
  'certifications',
  'projects',
  'blogPosts',
  'customSections',
];

const BLANK_EDUCATION = {
  college: { name: '', course: '', gradYear: '' },
  class12: { school: '', percentage: '', board: '', passingYear: '' },
  class10: { school: '', percentage: '', board: '', passingYear: '' },
};

export function sanitizeForPublic(portfolio) {
  // JSON round-trip: deep copy + drops `undefined` (Firestore rejects it).
  const out = JSON.parse(JSON.stringify(portfolio || {}));

  delete out.address; // never published, even if "show" was on
  delete out.profilePicDataUrl; // legacy field

  LIST_SECTIONS.forEach((key) => {
    if (!out[key]) return;
    // Kept when shown on the page OR on the resume (the resume reads the same published copy).
    if (!out[key].showOnPage && !out[key].showOnResume) out[key] = { showOnPage: false, items: [] };
  });

  if (!out.location?.showOnPage) out.location = { value: '', showOnPage: false };

  if (out.education) {
    Object.keys(BLANK_EDUCATION).forEach((key) => {
      if (!out.education[key]?.showOnPage) {
        out.education[key] = { ...BLANK_EDUCATION[key], showOnPage: false };
      }
    });
  }

  return out;
}
