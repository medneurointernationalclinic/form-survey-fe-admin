<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppSidebar from '../components/AppSidebar.vue'

const router = useRouter()
const auth = useAuthStore()

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">
    <AppSidebar />

    <div class="app-body">
      <header class="app-header">
        <div>
          <h1>MedNeuro Admin</h1>
          <p class="subtitle">Quản lý kết quả khảo sát</p>
        </div>
        <div class="header-actions">
          <span class="user-badge">Xin chào, {{ auth.username }}</span>
          <button class="btn-secondary" @click="handleLogout">Đăng xuất</button>
        </div>
      </header>

      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.app-body {
  grid-column: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.app-header h1 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px 48px;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 6px 12px;
  border-radius: 20px;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: var(--color-bg);
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .app-body {
    grid-column: 1;
    grid-row: 2;
  }
}

@media (max-width: 640px) {
  .app-header,
  .app-main {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
