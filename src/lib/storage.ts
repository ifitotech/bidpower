// Browser storage keys. The product went ContractorOS → BidPower; old keys are copied once
// so nobody loses saved preferences or drafts.

const LEGACY_KEYS: Record<string, string> = {
  "contractoros-theme": "bidpower-theme",
  "contractoros-locale": "bidpower-locale",
  "contractoros:material-list": "bidpower:material-list",
  "contractoros:plan-estimator-history": "bidpower:plan-estimator-history",
  "contractoros:settings-defaults": "bidpower:settings-defaults",
  "contractoros:supply-requests": "bidpower:supply-requests",
  "harbor-theme": "bidpower-theme",
  "harbor-locale": "bidpower-locale",
  "harbor:material-list": "bidpower:material-list",
  "harbor:plan-estimator-history": "bidpower:plan-estimator-history",
  "harbor:settings-defaults": "bidpower:settings-defaults",
  "harbor:supply-requests": "bidpower:supply-requests",
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
