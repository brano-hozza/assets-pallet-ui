<template>
  <h2>Get asset</h2>
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
  <pre v-if="returnedAsset">{{ returnedAsset }}</pre>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="!!assetHashValidationStatus || props.transactionRunning"
    @click="getAsset"
  >
    Get asset
  </n-button>
</template>
<script setup lang="ts">
import { NInput, NFormItem, NButton } from 'naive-ui'
const { $assets } = useNuxtApp()
const props = defineProps<{
  transactionRunning: boolean
}>()

// Single asset fetching
const assetHash = ref('')
const assetHashValidationStatus = computed(() =>
  assetHash.value.length === 66 ? undefined : 'error'
)
const assetHashValidationText = computed(() =>
  assetHash.value.length === 66 ? undefined : 'Hash must have 66 hex characters'
)
const returnedAsset = ref()
const getAsset = async () => {
  const assetManager = await $assets.getManager()
  returnedAsset.value = await assetManager.getAsset(assetHash.value)
}
</script>
