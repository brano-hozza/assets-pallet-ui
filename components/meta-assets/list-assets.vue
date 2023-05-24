<template>
  <h2>Assets</h2>
  <pre>{{ allAssets }}</pre>
</template>
<script setup lang="ts">
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()

const notificationStore = useNotificationStore()

// All assets
const allAssets = ref({})
const resolveAssets = async () => {
  const assetManager = await $assets.getManager()
  notificationStore.create(
    'Assets',
    'Fetching assets...',
    NotificationType.Info
  )
  allAssets.value = await assetManager.getAllAssets()
  notificationStore.create(
    'Assets',
    'Assets fetched!',
    NotificationType.Success
  )
}

watch(
  () => props.transactionRunning,
  async () => await resolveAssets()
)

onMounted(async () => {
  await resolveAssets()
})
</script>
