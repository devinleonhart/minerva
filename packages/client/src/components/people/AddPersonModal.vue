<template>
  <n-modal v-model:show="show" preset="card" title="Add New Person" style="width: 600px">
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
        <n-input v-model:value="formData.name" placeholder="Enter person's name" />
      </n-form-item>

      <n-form-item label="Description" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="Enter a description of this person"
          :rows="3"
        />
      </n-form-item>

      <n-form-item label="Relationship" path="relationship">
        <n-input
          v-model:value="formData.relationship"
          type="textarea"
          placeholder="Describe your relationship to this person"
          :rows="2"
        />
      </n-form-item>

      <n-form-item label="Notable Events" path="notableEvents">
        <n-input
          v-model:value="formData.notableEvents"
          type="textarea"
          placeholder="Describe any notable events or interactions"
          :rows="3"
        />
      </n-form-item>

      <n-form-item label="URL" path="url">
        <n-input v-model:value="formData.url" placeholder="Enter URL to pictures or more info" />
      </n-form-item>
    </n-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="show = false">Cancel</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          Add Person
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { FormInst, FormRules } from 'naive-ui'
import { useToast } from '@/composables/useToast'
import { usePeopleStore } from '@/store/people'
import type { CreatePersonRequest } from '@/types/store/people'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const peopleStore = usePeopleStore()
const toast = useToast()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)

const formData = reactive<CreatePersonRequest>({
  name: '',
  description: null,
  relationship: null,
  notableEvents: null,
  url: null
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter a person name', trigger: 'blur' },
    { min: 1, max: 255, message: 'Person name must be between 1 and 255 characters', trigger: 'blur' }
  ]
}

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    await peopleStore.createPerson(formData)
    toast.success('Person added successfully!')
    show.value = false
    formData.name = ''
    formData.description = null
    formData.relationship = null
    formData.notableEvents = null
    formData.url = null
  } catch (error) {
    console.error('Error adding person:', error)
    toast.error('Failed to add person. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
