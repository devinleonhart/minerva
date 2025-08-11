<template>
  <n-config-provider :theme="darkTheme">
    <n-notification-provider>
      <div class="app">
        <n-layout-header class="app-header" bordered>
          <div class="header-content">
            <h1 class="app-title">
              <n-icon size="32" class="title-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </n-icon>
              Minerva
            </h1>
            <nav class="app-nav">
              <n-button
                v-for="route in navigationRoutes"
                :key="route.path"
                :to="route.path"
                :type="currentRoute === route.path ? 'primary' : 'default'"
                :ghost="currentRoute !== route.path"
                class="nav-button"
                size="large"
              >
                <template #icon>
                  <n-icon>
                    <component :is="route.icon" />
                  </n-icon>
                </template>
                {{ route.name }}
              </n-button>
            </nav>
          </div>
        </n-layout-header>

        <n-layout-content class="app-main">
          <div class="content-wrapper">
            <router-view />
          </div>
        </n-layout-content>
      </div>
    </n-notification-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { computed, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  NConfigProvider,
  NLayoutHeader,
  NLayoutContent,
  NButton,
  NIcon,
  NNotificationProvider,
  darkTheme
} from 'naive-ui'

// Icons for navigation
const RecipeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z' })
])

const IngredientIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
])

const InventoryIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z' })
])

const ItemIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z' })
])

const ImportIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' })
])

const route = useRoute()
const currentRoute = computed(() => route.path)

const navigationRoutes = [
  { path: '/', name: 'Recipes', icon: RecipeIcon },
  { path: '/ingredients', name: 'Ingredients', icon: IngredientIcon },
  { path: '/inventory', name: 'Inventory', icon: InventoryIcon },
  { path: '/items', name: 'Items', icon: ItemIcon },
  { path: '/import', name: 'Quick Import', icon: ImportIcon }
]
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  padding: 0;
  height: auto;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.app-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.title-icon {
  color: #18a058;
}

.app-nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-button {
  font-weight: 500;
}

.app-main {
  padding: 2rem;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .app-nav {
    justify-content: center;
  }

  .app-main {
    padding: 1rem;
  }
}
</style>
