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
      <game-wrapper v-if="selectedAccount" />
      <n-alert v-else title="No Account" type="error" style="width: 100%">
        You need to select account first to load users skins.
      </n-alert>
    </n-space>
    <div style="height: 50vh" />
  </nuxt-layout>
</template>
<script setup lang="ts">
import { NSpace, NDivider, NAlert } from 'naive-ui'
import GameWrapper from '@/components/game/game-wrapper.vue'

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)
</script>
