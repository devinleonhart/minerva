<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <n-notification-provider placement="bottom-right">
        <div id="app">
          <n-layout>
            <n-layout-header class="header">
              <div class="header-content">
                <nav class="navigation">
                  <n-button
                    v-for="route in navigationRoutes"
                    :key="route.path"
                    :type="currentRoute === route.path ? 'primary' : 'default'"
                    :ghost="currentRoute !== route.path"
                    @click="navigateTo(route.path)"
                    class="nav-button"
                  >
                    {{ route.name }}
                  </n-button>
                </nav>
              </div>
            </n-layout-header>

            <n-layout-content class="main-content">
              <router-view />
            </n-layout-content>
          </n-layout>
        </div>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { darkTheme } from 'naive-ui'
import type { NavigationRoute } from './types/utils'

const router = useRouter()
const route = useRoute()

const navigationRoutes: NavigationRoute[] = [
  { path: '/recipes', name: 'Recipes' },
  { path: '/ingredients', name: 'Ingredients' },
  { path: '/inventory', name: 'Inventory' },
  { path: '/scheduler', name: 'Scheduler' },
  { path: '/people', name: 'People' },
  { path: '/spells', name: 'Spells' },
  { path: '/skills', name: 'Skills' }
]

const currentRoute = computed(() => route.path)

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  background: #1a1a1a;
}

.header {
  background: #2a2a2a;
  border-bottom: 1px solid #404040;
  padding: 0;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.navigation {
  display: flex;
  gap: 12px;
}

.nav-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-button:hover {
  transform: translateY(-1px);
}

.main-content {
  background: #1a1a1a;
  min-height: calc(100vh - 64px);
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  background: #1a1a1a;
  color: #ffffff;
}

* {
  box-sizing: border-box;
}
</style>
