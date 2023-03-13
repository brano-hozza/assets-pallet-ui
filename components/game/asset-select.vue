<template>
  <n-card style="width: 100%" title="Select your game skin">
    <n-select
      :options="playerAssets"
      default-value="default"
      @update:value="$emit('change', $event)"
    />
  </n-card>
</template>
<script setup lang="ts">
import { NSelect, NCard } from 'naive-ui'
defineEmits(['clear', 'change'])

const playerAssets = ref([
  {
    label: 'Default',
    value: 'default',
  },
])
</script>
