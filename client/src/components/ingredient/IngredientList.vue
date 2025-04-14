<template>
  <input type="text" v-model="searchQuery" placeholder="Search">
  <ul>
    <li v-for="ingredient in sortedIngredients" :key="ingredient.id">
      {{ ingredient.name }} - {{ ingredient.description }}
      <button @click="handleDelete(ingredient.id)">Delete</button>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'

const ingredientStore = useIngredientStore()
const { ingredients } = storeToRefs(useIngredientStore())
const sortedIngredients = computed(() => {
  let sorted = [...ingredients.value]
  if (searchQuery.value) {
    sorted = sorted.filter(ingredient => {
      return ingredient.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    })
  }
  return sorted.sort((a, b) => a.name.localeCompare(b.name))
})
const searchQuery = ref('')
onMounted(async () => {
  await ingredientStore.getIngredients()
})

const handleDelete = async (id: number) => {
  await ingredientStore.deleteIngredient(id)
  await ingredientStore.getIngredients()
}

</script>
