import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from './debounce'

describe('utils/debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('memanggil fn sekali setelah delay', () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d()
    d()
    d()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('meneruskan argumen terakhir', () => {
    const fn = vi.fn()
    const d = debounce(fn, 50)
    d('a')
    d('b')
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledWith('b')
  })

  it('cancel membatalkan pemanggilan tertunda', () => {
    const fn = vi.fn()
    const d = debounce(fn, 50)
    d()
    d.cancel()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
  })
})
