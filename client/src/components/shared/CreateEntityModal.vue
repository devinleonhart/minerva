<template>
  <n-modal v-model:show="showModal" preset="card" :title="title" style="width: 600px">
    <n-form @submit.prevent="handleSubmit" :model="formData" label-placement="top">
      <n-form-item label="Name" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="Enter name"
          required
        />
      </n-form-item>

      <n-form-item label="Description" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="Enter description"
          :rows="3"
          required
        />
      </n-form-item>

      <n-space justify="end">
        <n-button @click="handleCancel">Cancel</n-button>
        <n-button type="primary" :disabled="!canSubmit" attr-type="submit">
          {{ submitButtonText }}
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui'

import type { CreateEntityFormData, CreateEntityModalProps, CreateEntityModalEmits } from '@/types/components'

const props = withDefaults(defineProps<CreateEntityModalProps>(), {
  title: 'Create Entity',
  submitButtonText: 'Create'
})

const emit = defineEmits<CreateEntityModalEmits>()

const formData = ref<CreateEntityFormData>({
  name: '',
  description: ''
})

const showModal = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const canSubmit = computed(() =>
  formData.value.name.trim() && formData.value.description.trim()
)

watch(() => props.modelValue, (newShow) => {
  if (newShow && props.initialData) {
    formData.value = {
      name: props.initialData.name || '',
      description: props.initialData.description || ''
    }
  } else if (!newShow) {
    resetForm()
  }
})

const handleSubmit = () => {
  if (canSubmit.value) {
    emit('submit', { ...formData.value })
    resetForm()
  }
}

const handleCancel = () => {
  emit('cancel')
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: ''
  }
}

defineExpose({
  resetForm
})
</script>
