<template>
  <h2>Add admin</h2>
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
  <n-form-item label="Admin address">
    <n-input
      v-model:value="adminAddress"
      :disabled="transactionRunning"
      placeholder="Admin address"
    />
  </n-form-item>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !!assetHashValidationStatus ||
      !adminAddress?.length ||
      !selectedAccount ||
      props.transactionRunning
    "
    @click="addAdmin"
  >
    Sign & send
  </n-button>
</template>
<script setup lang="ts">
import { Keyring, SubmittableResult } from '@polkadot/api'
import { NInput, NFormItem, NButton } from 'naive-ui'

const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()
const emit = defineEmits(['change'])

// Add new asset
const adminAddress = ref('')
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

const addAdmin = async () => {
  emit('change', true)
  const assetManager = await $assets.getManager()

  let destinationAddress = adminAddress.value!
  if (destinationAddress.startsWith('//')) {
    const keyring = new Keyring({ type: 'sr25519' })
    destinationAddress = keyring.addFromUri(destinationAddress).address
  }
  await assetManager.registerAdmin(
    assetHash.value,
    destinationAddress,
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
