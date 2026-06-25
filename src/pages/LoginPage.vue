<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''

  if (!username.value || !password.value) {
    error.value = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
    return
  }

  loading.value = true
  try {
    await auth.login({ username: username.value, password: password.value })
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>MedNeuro Admin</h1>
        <p>Đăng nhập để xem kết quả khảo sát</p>
      </div>

      <form class="login-form"  @submit.prevent="handleSubmit">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <label class="field">
          <span>Tên đăng nhập</span>
          <input
            v-model="username"
            type="text"
            name="username"
            :disabled="loading"
          />
        </label>

        <label class="field">
          <span>Mật khẩu</span>
          <input
            v-model="password"
            type="password"
            name="password"
            :disabled="loading"
          />
        </label>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #dbeafe 0%, #f0f4f8 50%, #e0e7ff 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 40px 32px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 1.75rem;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.login-header p {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.field input {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  padding: 12px 20px;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid #fecaca;
}
</style>
