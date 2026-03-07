<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'radix-vue'
import { Check } from 'lucide-vue-next'

interface Props {
  checked?: boolean
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()
</script>

<template>
  <CheckboxRoot
    class="checkbox"
    :checked="checked"
    :disabled="disabled"
    :class="props.class"
    @update:checked="emit('update:checked', $event)"
  >
    <CheckboxIndicator class="checkbox-indicator">
      <Check />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<style scoped>
.checkbox {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-input);
  background-color: var(--color-background);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.15s, border-color 0.15s;
}

.checkbox[data-state='checked'] {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
}
</style>
