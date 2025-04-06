export interface Recipe {
  name: string;
  description: string;
  ingredients: Ingredient[];
}

export interface Ingredient {
  name: string;
  description: string;
  secured: boolean;
}
