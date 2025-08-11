<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-notification-provider>
      <div class="app">
        <n-layout-header class="app-header" bordered>
          <div class="header-content">

            <nav class="app-nav">
              <router-link
                v-for="route in navigationRoutes"
                :key="route.path"
                :to="route.path"
                custom
                v-slot="{ navigate, isActive }"
              >
                <n-button
                  @click="navigate"
                  :type="isActive ? 'primary' : 'default'"
                  :ghost="!isActive"
                  class="nav-button"
                  size="large"
                >
                  {{ route.name }}
                </n-button>
              </router-link>
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

import {
  NConfigProvider,
  NLayoutHeader,
  NLayoutContent,
  NButton,
  NNotificationProvider,
  darkTheme,
  GlobalThemeOverrides
} from 'naive-ui'



const navigationRoutes = [
  { path: '/', name: 'Recipes' },
  { path: '/ingredients', name: 'Ingredients' },
  { path: '/inventory', name: 'Inventory' },
  { path: '/items', name: 'Items' },
  { path: '/import', name: 'Quick Import' }
]

// Custom theme overrides for better contrast
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    baseColor: '#1a1a1a',
    cardColor: '#2a2a2a',
    textColorBase: '#ffffff',
    textColor1: '#ffffff',
    textColor2: '#e0e0e0',
    textColor3: '#c0c0c0',
    borderColor: '#404040',
    dividerColor: '#404040'
  },
  Card: {
    color: '#2a2a2a',
    colorModal: '#2a2a2a',
    colorEmbedded: '#2a2a2a',
    colorEmbeddedModal: '#2a2a2a',
    colorTrigger: '#2a2a2a',
    colorHover: '#2a2a2a',
    colorTarget: '#2a2a2a',
    colorPopover: '#2a2a2a',
    colorTooltip: '#2a2a2a',
    colorSegment: '#2a2a2a',
    colorResizable: '#2a2a2a',
    colorFocus: '#2a2a2a',
    colorDisabled: '#2a2a2a',
    colorAccent: '#2a2a2a',
    colorAccentHover: '#2a2a2a',
    colorAccentPressed: '#2a2a2a',
    colorAccentActive: '#2a2a2a',
    colorAccentDisabled: '#2a2a2a',
    colorAccentFocus: '#2a2a2a',
    colorAccentHoverFocus: '#2a2a2a',
    colorAccentPressedFocus: '#2a2a2a',
    colorAccentActiveFocus: '#2a2a2a',
    colorAccentDisabledFocus: '#2a2a2a'
  }
}
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
  justify-content: center;
  padding: 1rem 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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
