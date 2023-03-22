<template>
  <h2>Update asset</h2>
  <n-form-item
    label="Collection hash"
    :validation-status="collectionHashValidationStatus"
    :feedback="collectionHashValidationText"
  >
    <n-input
      v-model:value="collectionHash"
      :disabled="transactionRunning"
      placeholder="Collection hash"
    />
  </n-form-item>
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
  <n-form-item label="Metadata">
    <n-input
      v-model:value="propertyKey"
      style="width: 300px; margin-right: 10px"
      :disabled="transactionRunning"
      placeholder="Key"
    />
    <n-input
      v-model:value="propertyValue"
      style="margin-right: 10px"
      :disabled="transactionRunning"
      placeholder="Value"
    />
    <n-button
      type="primary"
      :disabled="transactionRunning || !propertyKey || !propertyValue"
      @click="addProperty()"
    >
      Add property
    </n-button>
  </n-form-item>
  <pre>{{ assetMetadata }}</pre>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !selectedAccount ||
      !!assetHashValidationStatus ||
      transactionRunning ||
      assetMetadata.size === 0
    "
    @click="updateAsset"
  >
    Update asset
  </n-button>
</template>
<script setup lang="ts">
import { ISubmittableResult } from '@polkadot/types/types'
import { NInput, NFormItem, NButton } from 'naive-ui'
const { $assets } = useNuxtApp()

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)
defineProps<{
  transactionRunning: boolean
}>()
const emit = defineEmits(['change'])
// Collection hash
const collectionHash = ref('')
const collectionHashValidationStatus = computed(() =>
  collectionHash.value.length === 66 ? undefined : 'error'
)
const collectionHashValidationText = computed(() =>
  collectionHash.value.length === 66
    ? undefined
    : 'Hash must have 66 hex characters'
)
// Asset hash
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)

watch(
  () => [assetHash.value, collectionHash.value],
  async ([aHash, cHash]) => {
    if (aHash.length === 66 && cHash.length === 66) {
      const assetManager = await $assets.getManager()
      if (!assetManager) {
        console.log('No assets manager found')
        return
      }
      const asset = await assetManager.getAsset(aHash, cHash)
      if (asset) {
        assetMetadata.clear()
        Object.entries(asset.meta).forEach(([key, value]) => {
          assetMetadata.set(key, value)
        })
      }
    }
  }
)

// Asset metadata
const assetMetadata = reactive<Map<string, string>>(new Map())

const propertyKey = ref('')
const propertyValue = ref('')

watch(
  () => propertyKey.value,
  (key) => {
    if (assetMetadata.has(key)) {
      propertyValue.value = assetMetadata.get(key)!
    }
  }
)
// Add new property
const addProperty = () => {
  assetMetadata.set(propertyKey.value, propertyValue.value)
  propertyKey.value = ''
  propertyValue.value = ''
}

// Update asset
const updateAsset = async () => {
  emit('change', true)
  const assetManager = await $assets.getManager()
  if (!assetManager) {
    console.log('No assets manager found')
    return
  }
  await assetManager.updateAssetMeta(
    assetHash.value,
    collectionHash.value,
    Object.fromEntries(assetMetadata),
    selectedAccount.value!.address,
    ({ dispatchError, txHash, status }: ISubmittableResult) => {
      const notificationStore = useNotificationStore()
      notificationStore.create(
        'Transaction',
        `Transaction hash is ${txHash.toHex()}`
      )
      if (dispatchError) {
        notificationStore.create(
          'Transaction error',
          `Transaction error ${assetManager.getTxError(
            dispatchError
          )} at blockHash ${status.asInBlock}`,
          NotificationType.Error
        )
        emit('change', false)
      }
      if (status.isFinalized) {
        notificationStore.create(
          'Transaction finalized',
          `Transaction finalized at blockHash ${status.asFinalized}`,
          NotificationType.Success
        )
        emit('change', false)
      }
    },
    selectedAccount.value!.dev
  )
}
</script>
