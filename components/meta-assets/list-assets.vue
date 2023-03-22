<template>
  <h2>Assets</h2>
  <pre>{{ allAssets }}</pre>
</template>
<script setup lang="ts">
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()

// All assets
const allAssets = ref({})
const resolveAssets = async () => {
  const assetManager = await $assets.getManager()
  if (!assetManager) {
    console.log('No assets manager found')
    return
  }
  allAssets.value = await assetManager.getAllAssets()
}

watch(
  () => props.transactionRunning,
  async () => await resolveAssets()
)

onMounted(async () => {
  await resolveAssets()
})
</script>
