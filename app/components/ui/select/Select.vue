<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator
} from 'radix-vue'
import { Check, ChevronDown } from 'lucide-vue-next'

interface Option {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SelectTrigger :class="props.class">
      <SelectValue :placeholder="placeholder" />
      <ChevronDown />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
          >
            <span>
              <SelectItemIndicator>
                <Check />
              </SelectItemIndicator>
            </span>
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
