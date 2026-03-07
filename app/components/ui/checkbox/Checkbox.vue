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
    :checked="checked"
    :disabled="disabled"
    :class="props.class"
    @update:checked="emit('update:checked', $event)"
  >
    <CheckboxIndicator>
      <Check />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
