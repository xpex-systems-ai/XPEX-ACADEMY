// FastAPI returns error `detail` in several shapes:
//   - string:                    HTTPException(status, detail="msg")
//   - array of {loc,msg,type}:   422 request validation (Pydantic)
//   - object {code,message,...}: custom structured errors (e.g. WEAK_PASSWORD)
// Passing a non-string into React state that later renders as a child throws
// "Objects are not valid as a React child" and crashes the page. Always funnel
// backend `detail` through this to get a safe display string.

// These backend details describe a product state already represented by the
// caller's localized fallback. Returning the fallback prevents a known English
// transport message from leaking into a Portuguese UI while preserving useful
// backend details for every other error.
const USE_LOCALIZED_FALLBACK = [
  /^invite code not found$/i,
  /^invalid invite code$/i,
  /^invite code (?:has )?expired$/i,
]

export function getErrorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) {
    const message = detail.trim()
    if (USE_LOCALIZED_FALLBACK.some((pattern) => pattern.test(message))) return fallback
    return message
  }
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((e) => (e && typeof e === 'object' && 'msg' in e ? (e as any).msg : typeof e === 'string' ? e : null))
      .filter((m): m is string => typeof m === 'string' && m.length > 0)
    if (msgs.length) return msgs.join(', ')
  }
  if (detail && typeof detail === 'object') {
    const m = (detail as any).message ?? (detail as any).msg
    if (typeof m === 'string' && m.trim()) {
      const message = m.trim()
      if (USE_LOCALIZED_FALLBACK.some((pattern) => pattern.test(message))) return fallback
      return message
    }
  }
  return fallback
}
