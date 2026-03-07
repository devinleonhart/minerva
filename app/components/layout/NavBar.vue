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
  <header>
    <nav>
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
