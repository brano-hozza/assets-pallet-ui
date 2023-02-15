<template>
  <h2>Update asset</h2>
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
  <n-form-item label="Metadata">
    <n-input
      v-model:value="propertyKey"
      style="width: 300px; margin-right: 10px"
      :disabled="props.transactionRunning"
      placeholder="Key"
    />
    <n-input
      v-model:value="propertyValue"
      style="margin-right: 10px"
      :disabled="props.transactionRunning"
      placeholder="Value"
    />
    <n-button
      type="primary"
      :disabled="props.transactionRunning"
      @click="addProperty()"
    >
      Add property
    </n-button>
  </n-form-item>
  <pre>{{ assetMetadata }}</pre>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="!!assetHashValidationStatus || props.transactionRunning"
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
const props = defineProps<{
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
// Metadata structure

type Meta = {
  [key: string]: string
}

// Asset metdata
const assetMetadata = ref<Meta>({})

const propertyKey = ref('')
const propertyValue = ref('')

watch(
  () => propertyKey.value,
  (key) => {
    if (key in assetMetadata.value) {
      propertyValue.value = assetMetadata.value[key]
    }
  }
)
// Add new property
const addProperty = () => {
  assetMetadata.value[propertyKey.value] = propertyValue.value
  propertyKey.value = ''
  propertyValue.value = ''
}

// Update asset
const updateAsset = async () => {
  const assetManager = await $assets.getManager()
  await assetManager.updateMeta(
    assetHash.value,
    assetMetadata.value,
    selectedAccount.value!.address,
    ({ status, txHash }: SubmittableResult) => {
      const notificationStore = useNotificationStore()
      notificationStore.create(
        'Transaction',
        `Transaction hash is ${txHash.toHex()}`
      )
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
