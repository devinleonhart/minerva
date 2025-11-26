<template>
  <n-modal v-model:show="showModal" preset="card" title="Add New Currency" style="width: 400px">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="Currency Name" path="name">
        <n-input v-model:value="formData.name" placeholder="Enter currency name" />
      </n-form-item>
      <n-form-item label="Initial Value" path="value">
        <n-input-number
          v-model:value="formData.value"
          placeholder="Enter initial value"
          :min="0"
          :precision="0"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="showModal = false">Cancel</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          Add Currency
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { FormInst, FormRules, NModal, NForm, NFormItem, NInput, NInputNumber, NButton } from 'naive-ui'
import { useInventoryStore } from '@/store/inventory'
import type { AddCurrencyRequest } from '@/types/store/inventory'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const inventoryStore = useInventoryStore()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)

const formData = reactive<AddCurrencyRequest>({
  name: '',
  value: 0
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter a currency name', trigger: 'blur' },
    { min: 1, max: 255, message: 'Currency name must be between 1 and 255 characters', trigger: 'blur' }
  ],
  value: [
    {
      validator: (rule: unknown, value: unknown) => {
        if (value === null || value === undefined) {
          return new Error('Please enter an initial value')
        }
        if (typeof value !== 'number') {
          return new Error('Value must be a number')
        }
        if (value < 0) {
          return new Error('Value must be a non-negative number')
        }
        return true
      },
      trigger: 'blur'
    }
  ]
}

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    isSubmitting.value = true
    await inventoryStore.addCurrency(formData.name, formData.value)
    console.log('Currency added successfully!')
    showModal.value = false
    formData.name = ''
    formData.value = 0
  } catch (error) {
    console.error('Failed to add currency. Please try again.', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
