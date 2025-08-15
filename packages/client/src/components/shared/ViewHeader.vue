<template>
  <div class="view-header">
    <div class="header-left">
      <slot name="left">
        <h2 v-if="title" class="view-title">{{ title }}</h2>
      </slot>
    </div>
    <div class="header-right">
      <slot name="right">
        <n-input
          v-if="showSearch"
          v-model:value="searchQuery"
          :placeholder="searchPlaceholder"
          size="large"
          class="search-input"
        />
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { NInput } from 'naive-ui'

import type { ViewHeaderProps, ViewHeaderEmits } from '@/types/components'

const props = withDefaults(defineProps<ViewHeaderProps>(), {
  showSearch: false,
  searchPlaceholder: 'Search...'
})

const emit = defineEmits<ViewHeaderEmits>()

const searchQuery = computed({
  get: () => props.searchValue || '',
  set: (value: string) => emit('update:searchValue', value)
})
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.header-left {
  flex-shrink: 0;
}

.header-right {
  flex: 1;
  max-width: 400px;
}

.view-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.8rem;
  font-weight: 600;
}

.search-input {
  width: 100%;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-right {
    max-width: none;
  }
}
</style>
