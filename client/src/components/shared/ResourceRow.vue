<template>
  <div class="resource-row">
    <div class="resource-row__leading">
      <slot name="leading">
        <div class="resource-row__title">
          <span
            v-if="indicator"
            class="resource-row__indicator"
            :class="`resource-row__indicator--${indicator}`"
            :title="indicatorTooltip"
          />
          <div class="resource-row__text">
            <p class="resource-row__name">{{ title }}</p>
            <p v-if="subtitle" class="resource-row__subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </slot>
    </div>

    <div class="resource-row__content">
      <slot />
    </div>

    <div class="resource-row__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'

type Indicator = 'success' | 'warning' | 'error' | 'info' | 'neutral'

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  indicator: {
    type: String as PropType<Indicator>,
    default: ''
  },
  indicatorTooltip: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.resource-row {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(160px, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #2b2b2b;
}

.resource-row__leading {
  display: flex;
  align-items: center;
  min-width: 0;
}

.resource-row__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.resource-row__indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
}

.resource-row__indicator--success {
  background-color: #63e2b7;
}

.resource-row__indicator--warning {
  background-color: #f6c659;
}

.resource-row__indicator--error {
  background-color: #d03050;
}

.resource-row__indicator--info {
  background-color: #8a8a8a;
}

.resource-row__indicator--neutral {
  background-color: #5a5a5a;
}

.resource-row__text {
  min-width: 0;
}

.resource-row__name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-row__subtitle {
  margin: 0;
  font-size: 12px;
  color: #bababa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-row__content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.resource-row__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .resource-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .resource-row__actions {
    justify-content: flex-start;
  }

  .resource-row__content {
    flex-wrap: wrap;
  }
}
</style>
