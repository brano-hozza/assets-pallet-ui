<template>
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
  emit('change', true)
  const assetManager = await $assets.getManager()
  await assetManager.add(
    assetName.value,
    selectedAccount.value!.address,
    ({ status, txHash, dispatchError }: SubmittableResult) => {
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
