<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  FlaskConical,
  Leaf,
  Package,
  Calendar,
  Users,
  Sparkles,
  Sword
} from 'lucide-vue-next'

interface NavRoute {
  path: string
  name: string
  icon: typeof FlaskConical
}

const router = useRouter()
const route = useRoute()

const routes: NavRoute[] = [
  { path: '/recipes', name: 'Recipes', icon: FlaskConical },
  { path: '/ingredients', name: 'Ingredients', icon: Leaf },
  { path: '/inventory', name: 'Inventory', icon: Package },
  { path: '/scheduler', name: 'Scheduler', icon: Calendar },
  { path: '/people', name: 'People', icon: Users },
  { path: '/spells', name: 'Spells', icon: Sparkles },
  { path: '/skills', name: 'Skills', icon: Sword }
]

const currentPath = computed(() => route.path)

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-brand">Minerva</div>
    <nav class="navbar-nav">
      <Button
        v-for="navRoute in routes"
        :key="navRoute.path"
        :variant="currentPath === navRoute.path ? 'default' : 'ghost'"
        size="sm"
        @click="navigateTo(navRoute.path)"
      >
        <component :is="navRoute.icon" />
        <span>{{ navRoute.name }}</span>
      </Button>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
  background-color: color-mix(in srgb, var(--color-background) 85%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.navbar-brand {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-wrap: nowrap;
  overflow-x: auto;
}
</style>
