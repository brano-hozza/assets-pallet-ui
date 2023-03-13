<template>
  <h2>Add asset</h2>
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
      !selectedAccount || !!assetValidationStatus || props.transactionRunning
    "
    @click="addAsset"
  >
    Sign & send
  </n-button>
</template>
<script setup lang="ts">
import { SubmittableResult } from '@polkadot/api'
import { NInput, NFormItem, NButton } from 'naive-ui'

const { $assets } = useNuxtApp()
const props = defineProps<{
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
// Add new asset
const assetName = ref('')
const assetValidationStatus = computed(() =>
  assetName.value.length > 3 ? undefined : 'error'
)
const assetValidationText = computed(() =>
  assetName.value.length > 3 ? undefined : 'At least 4 characters'
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

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

const addAsset = async () => {
  const notificationStore = useNotificationStore()
  emit('change', true)
  const assetManager = await $assets.getManager()
  try {
    await assetManager.createAsset(
      assetName.value,
      collectionHash.value,
      Object.fromEntries(assetMetadata),
      selectedAccount.value!.address,
      ({ status, txHash, dispatchError }: SubmittableResult) => {
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
  } catch (e) {
    notificationStore.create(
      'Validation error',
      (e as Error).message,
      NotificationType.Error
    )
    emit('change', false)
  }
}
</script>
