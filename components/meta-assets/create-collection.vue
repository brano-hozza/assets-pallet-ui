<template>
  <h2>Create collection</h2>
  <n-form-item
    label="Collection name"
    :validation-status="nameValidationStatus"
    :feedback="nameValidationText"
  >
    <n-input
      v-model:value="collectionName"
      :disabled="transactionRunning"
      placeholder="Collection name"
    />
  </n-form-item>
  <n-form-item
    label="Collection description"
    :validation-status="descriptionValidationStatus"
    :feedback="descriptionValidationText"
  >
    <n-input
      v-model:value="description"
      :disabled="transactionRunning"
      placeholder="Collection description"
    />
  </n-form-item>

  <n-form-item label="Schema for metadata">
    <n-input
      v-model:value="propertyKey"
      style="width: 300px; margin-right: 10px"
      :disabled="transactionRunning"
      placeholder="Key"
    />
    <n-input
      v-model:value="propertyValue"
      style="margin-right: 10px"
      :disabled="transactionRunning"
      placeholder="Value type (string, number, boolean)"
    />
    <n-button
      type="primary"
      :disabled="transactionRunning || !propertyKey || !propertyValue"
      @click="addProperty()"
    >
      Add property
    </n-button>
  </n-form-item>
  <pre>{{ collectionSchema }}</pre>
  <n-button
    style="width: 100%"
    type="primary"
    :disabled="
      !selectedAccount ||
      !!nameValidationStatus ||
      !!descriptionValidationStatus ||
      props.transactionRunning
    "
    @click="addCollection"
  >
    Sign & send
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

// Add new collection
const collectionName = ref('')
const nameValidationStatus = computed(() =>
  collectionName.value.length > 3 ? undefined : 'error'
)
const nameValidationText = computed(() =>
  collectionName.value.length > 3 ? undefined : 'At least 4 characters'
)

// Collection description
const description = ref('')
const descriptionValidationStatus = computed(() =>
  collectionName.value.length > 3 ? undefined : 'error'
)
const descriptionValidationText = computed(() =>
  collectionName.value.length > 3 ? undefined : 'At least 4 characters'
)

// Asset metadata
const collectionSchema = reactive<Map<string, string>>(new Map())

const propertyKey = ref('')
const propertyValue = ref('')

watch(
  () => propertyKey.value,
  (key) => {
    if (collectionSchema.has(key)) {
      propertyValue.value = collectionSchema.get(key)!
    }
  }
)
// Add new property
const addProperty = () => {
  collectionSchema.set(propertyKey.value, propertyValue.value)
  propertyKey.value = ''
  propertyValue.value = ''
}

const accountStore = useAccountStore()

const selectedAccount = computed(() => accountStore.selected)

const addCollection = async () => {
  const notificationStore = useNotificationStore()
  emit('change', true)
  const assetManager = await $assets.getManager()
  try {
    await assetManager.createCollection(
      collectionName.value,
      description.value,
      Object.fromEntries(collectionSchema),
      selectedAccount.value!.address,
      ({ status, txHash, dispatchError }: SubmittableResult) => {
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
  } catch (e) {
    notificationStore.create(
      'Validation error',
      (e as Error).message,
      NotificationType.Error
    )
    emit('change', false)
  }
}
</script>
