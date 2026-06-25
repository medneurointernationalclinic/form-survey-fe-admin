<script setup>
import { useRoute } from 'vue-router'
import logoUrl from '../assets/logo-header-blue.svg'

const route = useRoute()

const navItems = [
  { name: 'dashboard', label: 'Dashboard', to: '/', icon: '📋' },
  { name: 'chart', label: 'Chart', to: '/chart', icon: '📊' },
  { name: 'survey-forms', label: 'Phiếu khảo sát', to: '/survey-forms', icon: '📝' },
]
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <img :src="logoUrl" alt="MedNeuro" class="sidebar-logo" />
    </div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="sidebar-link"
        :class="{ active: route.name === item.name }"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        <span class="sidebar-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  grid-column: 1;
  position: sticky;
  top: 0;
  align-self: start;
  width: 220px;
  height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  justify-content: center;
  padding: 0 8px;
}

.sidebar-logo {
  width: 100%;
  max-width: 160px;
  height: auto;
  display: block;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s, color 0.2s;
}

.sidebar-link:hover {
  background: var(--color-bg);
}

.sidebar-link.active {
  background: #eff6ff;
  color: var(--color-primary);
}

.sidebar-icon {
  font-size: 1.1rem;
}

@media (max-width: 900px) {
  .app-sidebar {
    grid-column: 1;
    grid-row: 1;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 12px 16px;
  }

  .sidebar-nav {
    flex-direction: row;
  }

  .sidebar-brand {
    display: none;
  }

  .sidebar-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
