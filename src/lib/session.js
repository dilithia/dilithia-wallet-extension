let sessionUnlockedAt = null;
let sessionAutoLockMinutes = 15;

export function isSessionLocked() {
  if (!sessionUnlockedAt) return true;
  const elapsed = (Date.now() - sessionUnlockedAt) / 60_000;
  return elapsed > sessionAutoLockMinutes;
}

export function unlockSession(autoLockMinutes = 15) {
  sessionUnlockedAt = Date.now();
  sessionAutoLockMinutes = autoLockMinutes;
}

export function lockSession() {
  sessionUnlockedAt = null;
}

export function touchSession() {
  if (sessionUnlockedAt) {
    sessionUnlockedAt = Date.now();
  }
}

export function hasActiveSession() {
  return sessionUnlockedAt !== null;
}
