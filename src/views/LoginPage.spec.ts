import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LoginPage from './LoginPage.vue'

const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    useRoute: () => ({ query: {} }),
  }
})

const authMock = {
  login: vi.fn(),
  clearSession: vi.fn(),
  isAdmin: true,
  isAuthenticated: false,
}
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authMock,
}))

import { AppApiError } from '@/api/errors'

function mountLogin() {
  return mount(LoginPage, {
    global: {
      stubs: {
        BaseButton: defineComponent({
          props: { loading: Boolean, type: String, variant: String, size: String },
          template: '<button :disabled="loading"><slot /></button>',
        }),
        BaseIcon: defineComponent({ props: { name: String, size: Number }, template: '<svg />' }),
      },
    },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.isAdmin = true
    authMock.isAuthenticated = false
    authMock.login.mockReset()
    authMock.clearSession.mockReset()
    mockPush.mockReset()
    mockReplace.mockReset()
  })

  it('merender form login', () => {
    const w = mountLogin()
    expect(w.find('input[type="email"]').exists()).toBe(true)
    expect(w.find('input[id="password"]').exists()).toBe(true)
  })

  it('memanggil auth.login & redirect setelah sukses', async () => {
    authMock.login.mockResolvedValue(undefined)
    const w = mountLogin()
    await w.find('input[type="email"]').setValue('admin@rejki.id')
    await w.find('input[id="password"]').setValue('pass')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(authMock.login).toHaveBeenCalledWith('admin@rejki.id', 'pass')
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('menolak token non-admin (anti bypass)', async () => {
    authMock.login.mockImplementation(async () => {
      authMock.isAdmin = false
    })
    const w = mountLogin()
    await w.find('input[type="email"]').setValue('user@rejki.id')
    await w.find('input[id="password"]').setValue('pass')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(authMock.clearSession).toHaveBeenCalled()
    expect(w.text()).toContain('tidak memiliki akses admin')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('menampilkan pesan generik untuk 401', async () => {
    authMock.login.mockRejectedValue(
      new AppApiError('UNAUTHORIZED', 401, 'unauthorized', 'Sesi Anda berakhir.'),
    )
    const w = mountLogin()
    await w.find('input[type="email"]').setValue('x@x.id')
    await w.find('input[id="password"]').setValue('x')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(w.text()).toContain('Email atau kata sandi salah')
  })

  it('menampilkan userMessage untuk error non-401', async () => {
    authMock.login.mockRejectedValue(
      new AppApiError('NETWORK_ERROR', 0, 'net error', 'Tidak dapat terhubung ke server.'),
    )
    const w = mountLogin()
    await w.find('input[type="email"]').setValue('a@b.id')
    await w.find('input[id="password"]').setValue('p')
    await w.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(w.text()).toContain('Tidak dapat terhubung ke server')
  })
})
