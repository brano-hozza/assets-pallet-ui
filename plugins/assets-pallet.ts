import {
  ApiPromise,
  Keyring,
  WsProvider,
  SubmittableResult,
} from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api-base/types'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { DispatchError } from '@polkadot/types/interfaces'
import { ISubmittableResult } from '@polkadot/types/types'
import Ajv, { JSONSchemaType } from 'ajv'
const ajv = new Ajv()

export type Asset = {
  assetHash: string
  collectionHash: string
  name: string
  owner: string
  meta: Record<string, any>
}

type AssetDTO = {
  name: string
  owner: string
  meta: string
}

export type Collection = {
  hash: string
  name: string
  description: string
  schema: Record<string, any>
  author: string
  itemsCount: number
}

type CollectionDTO = {
  name: string
  description: string
  schema: string
  author: string
  itemsCount: number
}

export class AssetsManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: AssetsManager | null = null
  private api: ApiPromise | null = null

  private constructor(_api: Promise<ApiPromise>) {
    this.loadApi(_api)
  }

  private loadApi = async (_api: Promise<ApiPromise>): Promise<void> => {
    this.api = await _api
  }

  public static get(
    url: string = (import.meta.env.VITE_NODE_WS as string) ??
      'ws://localhost:9944'
  ): AssetsManager {
    if (!this.instance) {
      const wsProvider = new WsProvider(url)
      const api = ApiPromise.create({ provider: wsProvider })
      this.instance = new AssetsManager(api)
    }

    return this.instance
  }

  getTxError(dispatchError: DispatchError): string {
    if (dispatchError.isModule) {
      const decoded = this.api!.registry.findMetaError(dispatchError.asModule)
      const { docs, name, section } = decoded
      return `[${section}.${name}: ${docs.join(' ')}]`
    } else {
      return `[${dispatchError.toString()}]`
    }
  }

  async getAsset(assetHash: string, collectionHash: string): Promise<Asset> {
    while (!this.api) await new Promise((resolve) => setTimeout(resolve, 100))
    const entry = await this.api.query.metaAssets.assetsStore(
      collectionHash,
      assetHash
    )
    const dto = entry?.toHuman() as AssetDTO
    return {
      assetHash,
      collectionHash,
      name: dto.name,
      owner: dto.owner,
      meta: JSON.parse(dto.meta),
    }
  }

  async getAllAssets(): Promise<Asset[]> {
    while (!this.api) await new Promise((resolve) => setTimeout(resolve, 100))
    const entries = await this.api.query.metaAssets.assetsStore.entries()
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string, string]
      const asset = val?.[1]?.toHuman() as AssetDTO
      return {
        assetHash: key[1],
        collectionHash: key[0],
        name: asset.name,
        owner: asset.owner,
        meta: JSON.parse(asset.meta),
      }
    })
  }

  async getUserAssets(
    address: string,
    collectionHash?: string
  ): Promise<Asset[]> {
    while (!this.api) await new Promise((resolve) => setTimeout(resolve, 100))
    let entries = await this.api.query.metaAssets.assetsStore.entries()
    if (collectionHash)
      entries = entries?.filter(
        (val) => (val?.[0]?.toHuman() as [string, string])[0] === collectionHash
      )
    entries = entries?.filter(
      (val) => (val?.[1]?.toHuman() as AssetDTO).owner === address
    )
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string, string]
      const asset = val?.[1]?.toHuman() as AssetDTO
      return {
        assetHash: key[1],
        collectionHash: key[0],
        name: asset.name,
        owner: asset.owner,
        meta: JSON.parse(asset.meta),
      }
    })
  }

  async getCollections(): Promise<Collection[]> {
    while (!this.api) await new Promise((resolve) => setTimeout(resolve, 100))
    const entries = await this.api.query.metaAssets.collectionsStore.entries()
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string]
      const collection = val?.[1]?.toHuman() as CollectionDTO
      return {
        hash: key[0],
        name: collection.name,
        author: collection.author,
        description: collection.description,
        schema: JSON.parse(collection.schema),
        itemsCount: collection.itemsCount,
      }
    })
  }

  private async submitTx(
    ext: SubmittableExtrinsic<'promise'>,
    address: string,
    handler: (res: SubmittableResult) => void,
    dev = false
  ): Promise<() => void> {
    if (dev) {
      const keyring = new Keyring({ type: 'sr25519' })
      return ext.signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return ext.signAndSend(address, { signer: injector.signer }, handler)
  }

  async createCollection(
    name: string,
    description: string,
    schema: Record<string, any>,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    const validSchema = {} as Record<
      string,
      { type: 'string' | 'number' | 'boolean' }
    >
    for (const key in schema) {
      if (
        schema[key] === 'string' ||
        schema[key] === 'number' ||
        schema[key] === 'boolean'
      ) {
        validSchema[key] = { type: schema[key] }
      } else {
        throw new Error('Invalid schema')
      }
    }
    const ext = this.api.tx.metaAssets.createCollection(
      name,
      description,
      JSON.stringify({
        type: 'object',
        properties: validSchema,
        additionalProperties: false,
        required: Object.keys(validSchema),
      })
    )
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async removeCollection(
    collectionHash: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    const ext = this.api.tx.metaAssets.removeCollection(collectionHash)
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async createAsset(
    asset: string,
    collectionHash: string,
    meta: Record<string, any>,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    // Because Valico is not running on the node, we need to validate the schema
    // ourselves
    const collection = await this.api.query.metaAssets.collectionsStore(
      collectionHash
    )
    if (!collection) {
      throw new Error('Collection does not exist')
    }
    const schema = JSON.parse(
      (collection?.toHuman() as CollectionDTO)?.schema
    ) as JSONSchemaType<Record<string, any>>
    const validate = ajv.compile(schema)
    const valid = validate(meta)
    if (!valid) {
      throw new Error(validate.errors?.map((e) => e.message).join(', '))
    }

    const ext = this.api.tx.metaAssets.addAsset(
      asset,
      collectionHash,
      JSON.stringify(meta)
    )
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async removeAsset(
    assetHash: string,
    collectionHash: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    const ext = this.api.tx.metaAssets.removeAsset(collectionHash, assetHash)
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async updateAssetMeta(
    assetHash: string,
    collectionHash: string,
    meta: Record<string, any>,
    address: string,
    handler: (res: ISubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    // Because Valico is not running on the node, we need to validate the schema
    // ourselves
    const collection = await this.api.query.metaAssets.collectionsStore(
      collectionHash
    )
    if (!collection) {
      throw new Error('Collection does not exist')
    }
    const schema = JSON.parse(
      (collection?.toHuman() as CollectionDTO)?.schema
    ) as JSONSchemaType<Record<string, any>>
    const validate = ajv.compile(schema)
    const valid = validate(meta)
    if (!valid) {
      throw new Error(validate.errors?.map((e) => e.message).join(', '))
    }

    // Update the meta
    const ext = this.api.tx.metaAssets.updateMeta(
      collectionHash,
      assetHash,
      JSON.stringify(meta)
    )
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async transferAsset(
    assetHash: string,
    collectionHash: string,
    destinationAddress: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (!this.api) return Promise.reject(new Error('Api not loaded'))
    const ext = this.api.tx.metaAssets.transferAsset(
      collectionHash,
      assetHash,
      destinationAddress
    )
    return await this.submitTx(ext, address, handler, devAccount)
  }
}
export default defineNuxtPlugin(() => {
  return {
    provide: {
      assets: {
        getManager: () => AssetsManager.get(),
      },
    },
  }
})
