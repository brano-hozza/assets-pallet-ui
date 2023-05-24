<template>
  <h2>Collections</h2>
  <pre>{{ collections }}</pre>
</template>
<script setup lang="ts">
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()
const notificationStore = useNotificationStore()

// All assets
const collections = ref({})
const resolveCollections = async () => {
  const assetManager = await $assets.getManager()
  notificationStore.create(
    'Collections',
    'Fetching collections...',
    NotificationType.Info
  )
  collections.value = await assetManager.getCollections()
  notificationStore.create(
    'Collections',
    'Collections fetched!',
    NotificationType.Success
  )
}

watch(
  () => props.transactionRunning,
  async () => await resolveCollections()
)

onMounted(async () => {
  await resolveCollections()
})
</script>
