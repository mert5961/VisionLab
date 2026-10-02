export const PROGRESS_STORAGE_KEY = 'visionlab.progress.v1'

export function readCompletedLevels(validLevelIds: readonly string[]): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object' || !('completedLevelIds' in saved)) return []
    const ids = saved.completedLevelIds
    if (!Array.isArray(ids)) return []
    return validLevelIds.filter((id) => ids.includes(id))
  } catch {
    // Storage can be unavailable in privacy modes or contain an older/corrupt save.
    return []
  }
}

export function saveCompletedLevels(completedLevelIds: readonly string[]) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ completedLevelIds }))
  } catch {
    // Keep the current session playable when browser storage is unavailable.
  }
}
