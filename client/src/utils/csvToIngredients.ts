import Papa from 'papaparse'

import type { Prisma } from '#/prisma-types'

const isValidIngredient = (obj: unknown): obj is Prisma.IngredientCreateInput => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'description' in obj &&
    'secured' in obj &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.secured === 'boolean'
  )
}

const csvToIngredients = (csv: string): Prisma.IngredientCreateInput[] => {

  const parsedCSV = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true
  })
  const ingredients: Prisma.IngredientCreateInput[] = []

  parsedCSV.data.forEach((line) => {
    const [name, description, securedStr] = line
    const secured = securedStr === 'true'

    const ingredient: Prisma.IngredientCreateInput = {
      name,
      description,
      secured
    }

    if (isValidIngredient(ingredient)) {
      ingredients.push(ingredient)
    }
  })

  return ingredients
}

export default csvToIngredients
