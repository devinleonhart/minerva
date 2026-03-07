<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="props.class"
    @input="handleInput"
  />
</template>

<style scoped>
input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-input);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input::placeholder {
  color: var(--color-muted-foreground);
}

input:focus {
  outline: none;
  border-color: var(--color-ring);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-ring) 25%, transparent);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
