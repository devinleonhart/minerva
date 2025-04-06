import type { Ingredient } from '#/alchemy'

const addIngredient = (ingredient: Ingredient) => {
  console.log('Adding ingredient:', ingredient.name)
}

export { addIngredient }
