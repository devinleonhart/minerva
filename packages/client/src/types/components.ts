export interface ViewHeaderProps {
  title?: string
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
}

export interface ViewHeaderEmits {
  (e: 'update:searchValue', value: string): void
}

export interface IngredientListProps {
  searchQuery: string
}

export interface CardHeaderProps {
  title: string
}

export interface GridLayoutProps {
  variant?: 'default' | 'compact'
}

export interface CreateEntityFormData {
  name: string
  description: string
}

export interface CreateEntityModalProps {
  modelValue: boolean
  title?: string
  submitButtonText?: string
  initialData?: CreateEntityFormData
}

export interface CreateEntityModalEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: CreateEntityFormData): void
  (e: 'cancel'): void
}
