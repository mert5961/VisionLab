import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROGRESS_STORAGE_KEY, readCompletedLevels, saveCompletedLevels } from './progress'

beforeEach(() => localStorage.clear())

describe('saved progress', () => {
  it('restores only known levels in catalog order without duplicates', () => {
    saveCompletedLevels(['second', 'unknown', 'first', 'first'])
    expect(readCompletedLevels(['first', 'second'])).toEqual(['first', 'second'])
  })

  it.each(['broken json', 'null', '[]', '{"completedLevelIds":42}'])('ignores invalid saves: %s', (saved) => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, saved)
    expect(readCompletedLevels(['first'])).toEqual([])
  })

  it('works when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(readCompletedLevels(['first'])).toEqual([])
    expect(() => saveCompletedLevels(['first'])).not.toThrow()
  })
})
