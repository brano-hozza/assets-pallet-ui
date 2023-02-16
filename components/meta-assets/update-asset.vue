<template>
  <h2>Update asset</h2>
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
import { SubmittableResult } from '@polkadot/api'
import { NInput, NFormItem, NButton } from 'naive-ui'
const { $assets } = useNuxtApp()

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)
defineProps<{
  transactionRunning: boolean
}>()
const emit = defineEmits(['change'])

// Asset hash
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)

watch(
  () => assetHash.value,
  async (hash) => {
    if (hash.length === 66) {
      const assetManager = await $assets.getManager()
      const asset = await assetManager.getAsset(hash)
      if (asset) {
        assetMetadata.clear()
        Object.entries(asset.meta).forEach(([_key, _value]) => {
          // assetMetadata.set(key, value) //TODO: Check based on selected wallet
        })
      }
    }
  }
)

// Asset metdata
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
  await assetManager.updateMeta(
    assetHash.value,
    Object.fromEntries(assetMetadata),
    selectedAccount.value!.address,
    ({ status, txHash, isError, internalError }: SubmittableResult) => {
      const notificationStore = useNotificationStore()
      notificationStore.create(
        'Transaction',
        `Transaction hash is ${txHash.toHex()}`
      )
      if (isError) {
        notificationStore.create(
          'Transaction error',
          `Transaction error ${internalError?.name} at blockHash ${status.asInBlock}`,
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
