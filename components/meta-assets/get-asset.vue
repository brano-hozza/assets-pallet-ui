<template>
  <h2>Get asset</h2>
  <n-form-item
    label="Asset hash"
    :validation-status="assetHashValidationStatus"
    :feedback="assetHashValidationText"
  >
    <n-input
      v-model:value="assetHash"
      :disabled="props.transactionRunning"
      placeholder="Asset hash"
    />
  </n-form-item>
  <n-form-item label="Metadata:">
    <n-switch v-model:value="includeAllMetadata">
      <template #unchecked> Only mine </template>
      <template #unchecked-icon>
        <n-icon :component="ArrowForwardOutlined" />
      </template>
      <template #checked> Include all </template>
      <template #checked-icon>
        <n-icon :component="ArrowBackOutlined" />
      </template>
    </n-switch>
  </n-form-item>
  <pre v-if="returnedAsset">{{ returnedAsset }}</pre>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !!assetHashValidationStatus ||
      !selectedAccount ||
      props.transactionRunning
    "
    @click="getAsset"
  >
    Get asset
  </n-button>
</template>
<script setup lang="ts">
import { Keyring } from '@polkadot/api'
import { ArrowBackOutlined, ArrowForwardOutlined } from '@vicons/material'
import { NInput, NFormItem, NButton, NSwitch, NIcon } from 'naive-ui'
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

// Single asset fetching
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)
const includeAllMetadata = ref(false)
const returnedAsset = ref()
const getAsset = async () => {
  let address = selectedAccount.value!.address
  if (selectedAccount.value!.dev) {
    const keyring = new Keyring({ type: 'sr25519' })
    address = keyring.addFromUri(selectedAccount.value!.address).address
  }
  const assetManager = await $assets.getManager()
  returnedAsset.value = await assetManager.getAsset(
    assetHash.value,
    includeAllMetadata.value ? address : null
  )
}
</script>
