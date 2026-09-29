// Browser storage keys. The product used to be called ContractorOS; keys were renamed to "harbor".
// Old values are copied once so nobody loses saved preferences or drafts.

const LEGACY_KEYS: Record<string, string> = {
  "harbor-theme": "harbor-theme",
  "harbor-locale": "harbor-locale",
  "harbor:material-list": "harbor:material-list",
  "harbor:plan-estimator-history": "harbor:plan-estimator-history",
  "harbor:settings-defaults": "harbor:settings-defaults",
  "harbor:supply-requests": "harbor:supply-requests",
};

export function migrateLegacyStorage() {
  try {
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
      }
    }
  } catch {
    // Storage can be unavailable (private mode); the app works without it.
  }
}

// Runs once when the browser bundle loads, before any component reads its saved value.
if (typeof window !== "undefined") migrateLegacyStorage();
