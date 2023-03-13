<template>
  <nuxt-layout name="full-layout">
    <n-space justify="center">
      <h1>Welcome to sub-scaffold</h1>
    </n-space>
    <n-divider />
    <n-space vertical justify="center">
      <!--ALL COLLECTIONS-->
      <list-collections :transaction-running="transactionRunning" />
      <n-divider />

      <!--ALL ASSETS-->
      <list-assets :transaction-running="transactionRunning" />
      <n-divider />

      <!--CREATE COLLECTION-->
      <create-collection
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />

      <!--ADD ASSET-->
      <add-asset
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />

      <!--GET SINGLE ASSET-->
      <get-asset :transaction-running="transactionRunning" />
      <n-divider />

      <!--UPDATE SINGLE ASSET-->
      <update-asset
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />

      <!--TRANSFER SINGLE ASSET-->
      <transfer-asset
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />

      <!--REMOVE ASSET-->
      <remove-asset
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />

      <!--REMOVE COLLECTIOM-->
      <remove-collection
        :transaction-running="transactionRunning"
        @change="(val) => (transactionRunning = val)"
      />
      <n-divider />
    </n-space>
    <div class="filler" />
  </nuxt-layout>
</template>

<script setup lang="ts">
import { NSpace, NDivider } from 'naive-ui'
import ListAssets from '@/components/meta-assets/list-assets.vue'
import ListCollections from '@/components/meta-assets/list-collections.vue'
import AddAsset from '@/components/meta-assets/add-asset.vue'
import CreateCollection from '@/components/meta-assets/create-collection.vue'
import RemoveAsset from '@/components/meta-assets/remove-asset.vue'
import RemoveCollection from '@/components/meta-assets/remove-collection.vue'
import GetAsset from '@/components/meta-assets/get-asset.vue'
import TransferAsset from '@/components/meta-assets/transfer-asset.vue'
import UpdateAsset from '@/components/meta-assets/update-asset.vue'
definePageMeta({
  layout: false,
})
const transactionRunning = ref<boolean>(false)
</script>

<style scoped lang="scss"></style>
