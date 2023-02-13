<template>
  <nuxt-layout name="full-layout">
    <n-space justify="center">
      <h1>Welcome to sub-scaffold</h1>
    </n-space>
    <n-divider />
    <n-space vertical justify="center">
      <!--ALL ASSETS-->
      <h2>Assets pallet state</h2>
      <pre>{{ allAssets }}</pre>

      <!--ADD ASSET-->
      <h2>Add asset</h2>
      <n-form-item
        label="Asset name"
        :validation-status="assetValidationStatus"
        :feedback="assetValidationText"
      >
        <n-input
          v-model:value="assetName"
          :disabled="transactionRunning"
          placeholder="Asset name"
        />
      </n-form-item>
      <n-button
        style="width: 100%"
        type="primary"
        :disabled="
          !selectedAccount || assetName.length < 4 || transactionRunning
        "
        @click="addAsset"
      >
        Sign & send
      </n-button>

      <!--GET SINGLE ASSET-->
      <h2>Get asset</h2>
      <n-form-item
        label="Asset hash"
        :validation-status="assetHashValidationStatus"
        :feedback="assetHashValidationText"
      >
        <n-input
          v-model:value="assetHash"
          :disabled="transactionRunning"
          placeholder="Asset hash"
        />
      </n-form-item>
      <pre v-if="returnedAsset">{{ returnedAsset }}</pre>
      <n-button
        style="width: 100%"
        type="primary"
        :disabled="!!assetHashValidationStatus || transactionRunning"
        @click="getAsset"
      >
        Get asset
      </n-button>
    </n-space>
    <div class="filler" />
  </nuxt-layout>
</template>

<script setup lang="ts">
import { SubmittableResult } from '@polkadot/api'
import { NSpace, NDivider, NInput, NFormItem, NButton } from 'naive-ui'
import consola from 'consola'
definePageMeta({
  layout: false,
})

const logger = consola.create({
  defaults: {
    tag: 'index::assets:',
  },
})

const { $assets } = useNuxtApp()
const assetManager = await $assets.getManager()
const transactionRunning = ref(false)

// All assets
const allAssets = ref()
const resolveAssets = async () => {
  const all = await assetManager.getAll()
  allAssets.value = all
  transactionRunning.value = false
}

onMounted(async () => {
  await resolveAssets()
})

// Add new asset
const assetName = ref('')
const assetValidationStatus = computed(() =>
  assetName.value.length > 3 ? undefined : 'error'
)
const assetValidationText = computed(() =>
  assetName.value.length > 3 ? undefined : 'At least 4 characters'
)

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
        logger.info(`Transaction hash is: ${txHash.toHex()}`)
        notificationStore.create(
          'Transaction',
          `Transaction hash is ${txHash.toHex()}`
        )
        if (status.isFinalized) {
          logger.success('Transaction finalized')
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

// Single asset fetching
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)
const returnedAsset = ref()
const getAsset = async () => {
  returnedAsset.value = await assetManager.get(assetHash.value)
}
// Lemon Pie, Geisha, Hawaii, Exotika
</script>

<style scoped lang="scss"></style>
