export function migrateStorageKeys(
  storage: Storage,
  keyPairs: readonly (readonly [string, string])[],
) {
  for (const [legacyKey, currentKey] of keyPairs) {
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue === null) continue;
    if (storage.getItem(currentKey) === null) {
      storage.setItem(currentKey, legacyValue);
    }
    storage.removeItem(legacyKey);
  }
}
