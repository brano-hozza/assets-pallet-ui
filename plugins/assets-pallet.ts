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

type AssetDTO = {
  name: string
  owner: string
  meta: string
}

type Collection = {
  hash: string
  name: string
  description: string
  schema: Record<string, any>
  author: string
}

type CollectionDTO = {
  name: string
  description: string
  schema: string
  author: string
}

type Asset = {
  assetHash: string
  collectionHash: string
  name: string
  owner: string
  meta: Record<string, any>
}

class AssetsManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: AssetsManager | null = null
  // eslint-disable-next-line no-useless-constructor
  private constructor(private api: ApiPromise) {}

  public static async get(url = 'ws://localhost:9944'): Promise<AssetsManager> {
    if (!this.instance) {
      const wsProvider = new WsProvider(url)
      const api = await ApiPromise.create({ provider: wsProvider })
      this.instance = new AssetsManager(api)
    }
    return this.instance
  }

  getTxError(dispatchError: DispatchError): string {
    if (dispatchError.isModule) {
      const decoded = this.api.registry.findMetaError(dispatchError.asModule)
      const { docs, name, section } = decoded
      return `[${section}.${name}: ${docs.join(' ')}]`
    } else {
      return `[${dispatchError.toString()}]`
    }
  }

  async getAsset(assetHash: string, collectionHash: string): Promise<Asset> {
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

  async getCollections(): Promise<Collection[]> {
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
      }
    })
  }

  private async submitTx(
    ext: SubmittableExtrinsic<'promise'>,
    address: string,
    handler: (res: SubmittableResult) => void,
    dev = false
  ) {
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
    const ext = this.api.tx.metaAssets.createCollection(
      name,
      description,
      JSON.stringify(schema)
    )
    return await this.submitTx(ext, address, handler, devAccount)
  }

  async removeCollection(
    collectionHash: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
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
