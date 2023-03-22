<template>
  <h2>Remove asset</h2>
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
  <n-button
    style="width: 100%"
    type="error"
    :disabled="
      !selectedAccount || !!assetHashValidationStatus || transactionRunning
    "
    @click="removeAsset"
  >
    Remove asset
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

// Remove asset
const removeAsset = async () => {
  emit('change', true)
  const assetManager = await $assets.getManager()
  if (!assetManager) {
    console.log('No assets manager found')
    return
  }
  await assetManager.removeAsset(
    assetHash.value,
    collectionHash.value,
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
