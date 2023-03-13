<template>
  <n-card style="width: 100%" title="Select your game skin">
    <n-select
      :options="playerAssets"
      default-value="default"
      @update:value="$emit('change', $event)"
    />
  </n-card>
</template>
<script setup lang="ts">
import { Keyring } from '@polkadot/api'
import { NSelect, NCard } from 'naive-ui'
const { $assets } = useNuxtApp()

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
  const manager = await $assets.getManager()
  const collections = await manager.getCollections()
  const ticTacToeCollection = collections.find(
    (collection) => collection.name === 'Tic Tac Toe'
  )
  if (ticTacToeCollection) {
    const keyring = new Keyring({ type: 'sr25519' })
    const address = selectedAccount.value.dev
      ? keyring.createFromUri(selectedAccount.value.address).address
      : selectedAccount.value.address
    const assets = await manager.getUserAssets(
      address,
      ticTacToeCollection.hash
    )
    if (assets.length === 0) {
      console.log('No assets found')
      return
    }
    playerAssets.value.push(
      ...assets.map((asset) => ({
        label: asset.name,
        value: asset.assetHash,
      }))
    )
  } else {
    console.log('No collection found')
  }
})
</script>
