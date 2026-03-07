<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  rows: 3
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :class="props.class"
    @input="handleInput"
  />
</template>
