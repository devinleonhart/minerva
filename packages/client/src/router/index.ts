import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Recipes',
    component: () => import('@/views/RecipeView.vue')
  },
  {
    path: '/ingredients',
    name: 'Ingredients',
    component: () => import('@/views/IngredientView.vue')
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/InventoryView.vue')
  },
  {
    path: '/import',
    name: 'QuickImport',
    component: () => import('@/views/QuickImport.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
