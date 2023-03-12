<template>
  <h2>Collections</h2>
  <pre>{{ collections }}</pre>
</template>
<script setup lang="ts">
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()

// All assets
const collections = ref({})
const resolveCollections = async () => {
  const assetManager = await $assets.getManager()
  collections.value = await assetManager.getCollections()
}

watch(
  () => props.transactionRunning,
  async () => await resolveCollections()
)

onMounted(async () => {
  await resolveCollections()
})
</script>
