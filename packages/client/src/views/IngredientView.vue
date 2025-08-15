<template>
  <div class="ingredient-view">
    <IngredientList />
    <IngredientAddForm />
  </div>
</template>

<script lang="ts" setup>
import IngredientList from '@/components/ingredient/IngredientList.vue'
import IngredientAddForm from '@/components/ingredient/IngredientAddForm.vue'
</script>

<style scoped>
.ingredient-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #1a1a1a;
  min-height: 100vh;
}
</style>
