<template>
  <h2>Transfer asset</h2>
  <n-form-item
    label="Asset hash"
    :validation-status="assetHash2ValidationStatus"
    :feedback="assetHash2ValidationText"
  >
    <n-input
      v-model:value="assetHash2"
      :disabled="props.transactionRunning"
      placeholder="Asset hash"
    />
  </n-form-item>
  <n-form-item
    label="Destination addresss"
    :validation-status="destinationAddressValidationStatus"
    :feedback="destinationAddressValidationText"
  >
    <n-input
      v-model:value="destinationAddress"
      :disabled="props.transactionRunning"
      placeholder="Destination address"
    />
  </n-form-item>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !!destinationAddressValidationStatus ||
      !selectedAccount ||
      props.transactionRunning
    "
    @click="transferAsset"
  >
    Sign & transfer
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

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

// Transfer asset
const assetHash2 = ref('')
const assetHash2ValidationStatus = computed(() =>
  assetHash2.value.length === 66 ? undefined : 'error'
)
const assetHash2ValidationText = computed(() =>
  assetHash2.value.length === 66
    ? undefined
    : 'Hash must have 66 hex characters'
)
const destinationAddress = ref('')
const destinationAddressValidationStatus = computed(() =>
  destinationAddress.value.length === 48 ? undefined : 'error'
)
const destinationAddressValidationText = computed(() =>
  destinationAddress.value.length === 48
    ? undefined
    : 'Address must have 48 hex characters'
)
const transferAsset = async () => {
  emit('change', true)
  const assetManager = await $assets.getManager()
  await assetManager.transfer(
    assetHash2.value,
    destinationAddress.value,
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
