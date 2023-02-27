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

  <n-form-item label="Destination address">
    <n-select
      v-model:value="selectedDestination"
      :options="destinationOptions"
      class="destination-select"
      placeholder="Select destination"
      :disabled="!selectedAccount || props.transactionRunning"
      filterable
      clearable
    />
  </n-form-item>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !selectedDestination || !selectedAccount || props.transactionRunning
    "
    @click="transferAsset"
  >
    Sign & transfer
  </n-button>
</template>
<script setup lang="ts">
import { Keyring, SubmittableResult } from '@polkadot/api'
import { NInput, NFormItem, NButton, NSelect } from 'naive-ui'

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

const accounts = computed(() => accountStore.accounts.filter((acc) => !acc.dev))
const devAccounts = computed(() =>
  accountStore.accounts.filter((acc) => acc.dev)
)

const selectedDestination = ref<string | null>(null)

const destinationOptions = computed(() => [
  {
    type: 'group',
    label: 'Testing accounts',
    key: 'testing',
    children: devAccounts.value
      .filter((val) => val.id !== selectedAccount.value?.id)
      .map((val) => ({
        label: val.meta.name,
        key: val.id,
        value: val.address,
      })),
  },
  {
    type: 'group',
    label: 'Official accounts',
    key: 'official',
    children: accounts.value
      .filter((val) => val.id !== selectedAccount.value?.id)
      .map((val) => ({
        label: val.meta.name,
        key: val.id,
        value: val.address,
      })),
  },
])

const transferAsset = async () => {
  emit('change', true)
  const assetManager = await $assets.getManager()

  let destinationAddress = selectedDestination.value!
  if (destinationAddress.startsWith('//')) {
    const keyring = new Keyring({ type: 'sr25519' })
    destinationAddress = keyring.addFromUri(destinationAddress).address
  }
  await assetManager.transfer(
    assetHash2.value,
    destinationAddress,
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
