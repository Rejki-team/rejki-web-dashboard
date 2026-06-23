import { describe, it, expect, beforeEach } from 'vitest'
import { tokenStorage } from './tokenStorage'

describe('utils/tokenStorage', () => {
  beforeEach(() => localStorage.clear())

  it('set & get access/refresh', () => {
    tokenStorage.set('acc', 'ref')
    expect(tokenStorage.getAccess()).toBe('acc')
    expect(tokenStorage.getRefresh()).toBe('ref')
  })

  it('setAccess memperbarui hanya access', () => {
    tokenStorage.set('acc', 'ref')
    tokenStorage.setAccess('acc2')
    expect(tokenStorage.getAccess()).toBe('acc2')
    expect(tokenStorage.getRefresh()).toBe('ref')
  })

  it('clear menghapus keduanya', () => {
    tokenStorage.set('acc', 'ref')
    tokenStorage.clear()
    expect(tokenStorage.getAccess()).toBeNull()
    expect(tokenStorage.getRefresh()).toBeNull()
  })
})
