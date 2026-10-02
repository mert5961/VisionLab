import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { PROGRESS_STORAGE_KEY, saveCompletedLevels } from './game/progress'

// Canvas pixels are verified by the real pipeline tests; jsdom has no renderer.
vi.mock('./components/SignalScreen', () => ({ SignalScreen: () => null }))

beforeEach(() => {
  localStorage.clear()
  // Exercise the app's real analysis fallback, without a browser worker in jsdom.
  vi.stubGlobal('Worker', undefined)
})

describe('mission progress', () => {
  it('saves a solved level immediately and keeps it after Restore and reload', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start Operator Mode' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Operation for mono' }), 'to_grayscale')
    await waitFor(() => expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!).completedLevelIds).toContain('raw-feed'))
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    unmount()
    render(<App />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Signal Emerges')
    expect((screen.getByRole('button', { name: /Signal Emerges/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('opens the selected completed level instead of the next suggested mission', async () => {
    saveCompletedLevels(['raw-feed'])
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Raw Feed/ }))
    expect(screen.getByRole('combobox', { name: 'Operation for mono' })).toBeTruthy()
    expect(document.querySelector('.operator-bar__label')?.textContent).toContain('Raw Feed')
  })

  it('does not open locked levels', () => {
    render(<App />)
    const locked = screen.getByRole('button', { name: /Signal Emerges/ })
    expect((locked as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(locked)
    expect(screen.getByRole('button', { name: 'Start Operator Mode' })).toBeTruthy()
  })

  it('keeps closed diagnostics out of the accessibility tree', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start Operator Mode' }))
    expect(screen.queryByRole('complementary', { name: 'Diagnostics' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Analysis' }))
    const panel = screen.getByRole('complementary', { name: 'Diagnostics' })
    await user.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('complementary', { name: 'Diagnostics' })).toBeNull()
  })
})
