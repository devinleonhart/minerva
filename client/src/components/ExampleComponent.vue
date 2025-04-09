<template>
    <h1>Example Component</h1>
</template>

<script lang="ts" setup>

import { addIngredient } from '@/utils/ingredient/add'
const exampleIngredient = {
  name: 'Example Ingredient',
  description: 'This is an example ingredient.',
  secured: false,
}
addIngredient(exampleIngredient)

</script>
