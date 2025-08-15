<template>
  <n-modal v-model:show="showModal" preset="card" title="Add New Item to Inventory" style="width: 400px">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="Item Name" path="name">
        <n-input v-model:value="formData.name" placeholder="Enter item name" />
      </n-form-item>
      <n-form-item label="Description" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="Enter item description"
          :rows="3"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="showModal = false">Cancel</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          Add to Inventory
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { FormInst, FormRules, NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useToast } from '@/composables/useToast'
import { useInventoryStore } from '@/store/inventory'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'item-created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const inventoryStore = useInventoryStore()
const toast = useToast()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)

const formData = reactive({
  name: '',
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter an item name', trigger: 'blur' },
    { min: 1, max: 255, message: 'Item name must be between 1 and 255 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter a description', trigger: 'blur' },
    { min: 1, max: 1000, message: 'Description must be between 1 and 1000 characters', trigger: 'blur' }
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

    // Add item directly to inventory
    await inventoryStore.addItemToInventory({
      name: formData.name,
      description: formData.description
    })

    toast.success('Item added to inventory successfully!')
    showModal.value = false
    formData.name = ''
    formData.description = ''
    emit('item-created')
  } catch (error) {
    console.error('Error adding item to inventory:', error)
    toast.error('Failed to add item to inventory. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
