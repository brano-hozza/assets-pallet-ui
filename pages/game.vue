<template>
  <nuxt-layout name="full-layout">
    <n-space justify="center">
      <h1>Tic Tac Toe example</h1>
    </n-space>
    <n-divider />
    <n-space
      vertical
      justify="center"
      align="center"
      :wrap-item="false"
      style="width: 100%"
    >
      <game-wrapper />
    </n-space>
  </nuxt-layout>
</template>
<script setup lang="ts">
import { NSpace, NDivider } from 'naive-ui'
import GameWrapper from '@/components/game/game-wrapper.vue'
</script>
