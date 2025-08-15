import { createRouter, createWebHistory } from 'vue-router'
import IngredientView from '../views/IngredientView.vue'
import InventoryView from '../views/InventoryView.vue'
import RecipeView from '../views/RecipeView.vue'
import SchedulerView from '../views/SchedulerView.vue'
import PeopleView from '../views/PeopleView.vue'
import SpellsAndSkillsView from '../views/SpellsAndSkillsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/recipes'
    },
    {
      path: '/ingredients',
      name: 'ingredients',
      component: IngredientView
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: RecipeView
    },
    {
      path: '/scheduler',
      name: 'scheduler',
      component: SchedulerView
    },
    {
      path: '/people',
      name: 'people',
      component: PeopleView
    },
    {
      path: '/spells-and-skills',
      name: 'spells-and-skills',
      component: SpellsAndSkillsView
    }
  ]
})

export default router
