<template>
  <n-card style="width: 100%" title="Select your game skin">
    <n-select
      :options="playerAssets"
      default-value="default"
      :disabled="playerAssets.length === 1"
      @update:value="$emit('change', $event)"
    />
  </n-card>
</template>
<script setup lang="ts">
import { Keyring } from '@polkadot/api'
import { NSelect, NCard } from 'naive-ui'
import { AssetsManager } from 'meta-assets/plugins/assets-pallet'
const { $assets } = useNuxtApp()
const notificationStore = useNotificationStore()

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

defineEmits(['clear', 'change'])

const playerAssets = ref([
  {
    label: 'Default',
    value: 'default',
  },
])

onMounted(async () => {
  if (selectedAccount.value === null) {
    return
  }

  notificationStore.create(
    'Asset select',
    'Fetching collections...',
    NotificationType.Info
  )
  const manager: AssetsManager = $assets.getManager()
  try {
    const collections = await manager.getCollections()
    const ticTacToeCollection = collections.find(
      (collection) => collection.name === 'tic-tac-toe'
    )
    if (!ticTacToeCollection) {
      throw new Error('No tic-tac-toe collection found')
    }
    const keyring = new Keyring({ type: 'sr25519' })
    const address = selectedAccount.value.dev
      ? keyring.createFromUri(selectedAccount.value.address).address
      : selectedAccount.value.address
    const assets = await manager.getUserAssets(
      address,
      ticTacToeCollection.hash
    )
    playerAssets.value.push(
      ...assets.map((asset) => ({
        label: asset.name,
        value: asset.assetHash,
      }))
    )
  } catch (e) {
    if (e instanceof Error) {
      notificationStore.create(
        'Asset select',
        'Error fetching assets: ' + e.message,
        NotificationType.Error
      )
    }
  }
})
</script>
