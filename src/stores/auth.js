import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials) {
    const response = await loginApi(credentials.username, credentials.password)

    if (!response.success) {
      throw new Error(response.message || 'Đăng nhập thất bại')
    }

    token.value = response.data.token
    username.value = response.data.username

    localStorage.setItem('token', response.data.token)
    localStorage.setItem('username', response.data.username)

    return response
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return { token, username, isAuthenticated, login, logout }
})
