<template>
  <n-modal v-model:show="show" preset="card" title="Edit Ingredient" style="width: 500px">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="Name" path="name">
        <n-input v-model:value="formData.name" placeholder="Enter ingredient name" />
      </n-form-item>

      <n-form-item label="Description" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="Enter ingredient description"
          :rows="3"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="show = false">Cancel</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          Save Changes
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { FormInst, FormRules } from 'naive-ui'
import { useIngredientStore } from '@/store/ingredient'
import type { Ingredient, UpdateIngredientRequest } from '@/types/store/ingredient'

interface Props {
  modelValue: boolean
  ingredient: Ingredient | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const ingredientStore = useIngredientStore()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)

const formData = reactive<UpdateIngredientRequest>({
  name: '',
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter an ingredient name', trigger: 'blur' },
    { min: 1, max: 255, message: 'Ingredient name must be between 1 and 255 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter a description', trigger: 'blur' }
  ]
}

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

watch(() => props.ingredient, (newIngredient) => {
  if (newIngredient) {
    formData.name = newIngredient.name
    formData.description = newIngredient.description
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!props.ingredient) return

  try {
    await formRef.value?.validate()
    isSubmitting.value = true
    await ingredientStore.updateIngredient(props.ingredient.id, formData)
    await ingredientStore.getIngredients()
    console.log('Ingredient updated successfully!')
    show.value = false
  } catch (error) {
    console.error('Failed to update ingredient. Please try again.', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
