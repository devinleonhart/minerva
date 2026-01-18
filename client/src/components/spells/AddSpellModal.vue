<template>
  <n-modal v-model:show="show" preset="card" title="Add New Spell" style="width: 500px">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="Spell Name" path="name">
        <n-input v-model:value="formData.name" placeholder="Enter spell name" />
      </n-form-item>

      <n-form-item label="Stars Needed" path="neededStars">
        <n-input-number
          v-model:value="formData.neededStars"
          :min="1"
          :max="20"
          :precision="0"
          placeholder="How many stars to learn?"
        />
      </n-form-item>

      <n-form-item label="Current Progress" path="currentStars">
        <n-input-number
          v-model:value="formData.currentStars"
          :min="0"
          :max="formData.neededStars"
          :precision="0"
          placeholder="Current progress (optional)"
        />
        <template #feedback>
          <span style="color: #666; font-size: 12px;">
            Leave at 0 if you haven't started learning this spell yet
          </span>
        </template>
      </n-form-item>
    </n-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="show = false">Cancel</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          Add Spell
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { FormInst, FormRules } from 'naive-ui'
import { useSpellsStore } from '@/store/spells'
import type { CreateSpellRequest } from '@/types/store/spells'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const spellsStore = useSpellsStore()
const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)

const formData = reactive<CreateSpellRequest>({
  name: '',
  neededStars: 1,
  currentStars: 0
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter a spell name', trigger: ['blur', 'input'] },
    { min: 1, max: 255, message: 'Spell name must be between 1 and 255 characters', trigger: ['blur', 'input'] }
  ],
  neededStars: [
    { required: true, message: 'Please specify how many stars are needed', trigger: ['blur', 'input'] }
  ],
  currentStars: []
}

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSubmit = async () => {
  if (!formData.name || !formData.name.trim()) {
    console.error('Please enter a spell name')
    return
  }

  if (!formData.neededStars || formData.neededStars <= 0) {
    console.error('Please specify how many stars are needed')
    return
  }

  if (formData.currentStars && formData.currentStars > formData.neededStars) {
    console.error('Current stars cannot exceed needed stars')
    return
  }

  try {
    await spellsStore.createSpell({
      name: formData.name.trim(),
      neededStars: formData.neededStars,
      currentStars: formData.currentStars || 0
    })

    console.log('Spell added successfully!')
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    console.error('Failed to add spell. Please try again.', error)
  }
}

const resetForm = () => {
  formData.name = ''
  formData.neededStars = 1
  formData.currentStars = 0
}

watch(() => formData.neededStars, (newValue) => {
  if (newValue !== undefined && formData.currentStars !== undefined && formData.currentStars > newValue) {
    formData.currentStars = newValue
  }
})
</script>
