<template>
  <nuxt-layout name="full-layout">
    <n-space justify="center">
      <h1>Welcome to sub-scaffold</h1>
    </n-space>
    <n-divider />
    <n-space vertical justify="center">
      <h2>Assets pallet state</h2>
      <pre>{{ assets }}</pre>
      <h2>Add asset</h2>
      <n-input
        v-model:value="assetName"
        :disabled="transactionRunning"
        placeholder="Asset name"
      />
      <n-button
        style="width: 100%"
        :disabled="
          !selectedAccount || assetName.length < 4 || transactionRunning
        "
        @click="addAsset"
      >
        Sign & send
      </n-button>
    </n-space>
    <div class="filler" />
  </nuxt-layout>
</template>

<script setup lang="ts">
import { SubmittableResult } from '@polkadot/api'
import { NSpace, NDivider, NInput, NButton } from 'naive-ui'
definePageMeta({
  layout: false,
})
const { $assets } = useNuxtApp()
const assetManager = await $assets.getManager()
const assets = ref()
const assetName = ref('')
const transactionRunning = ref(false)

const resolveAssets = async () => {
  const all = await assetManager.getAll()
  assets.value = all
  transactionRunning.value = false
}

onMounted(async () => {
  await resolveAssets()
})

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

const addAsset = async () => {
  if (selectedAccount.value) {
    transactionRunning.value = true
    await assetManager.add(
      assetName.value,
      selectedAccount.value.address,
      async ({ status, txHash }: SubmittableResult) => {
        const notificationStore = useNotificationStore()
        console.log(`Transaction hash is: ${txHash.toHex()}`)
        notificationStore.create(
          'Transaction',
          `Transaction hash is ${txHash.toHex()}`
        )
        if (status.isFinalized) {
          console.log('Transaction finalized')
          notificationStore.create(
            'Transaction finalized',
            `Transaction finalized at blockHash ${status.asFinalized}`,
            NotificationType.Success
          )
          await resolveAssets()
        }
      },
      selectedAccount.value.dev
    )
  }
}
</script>

<style scoped lang="scss"></style>
