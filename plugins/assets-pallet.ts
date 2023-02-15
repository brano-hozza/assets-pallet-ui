import {
  ApiPromise,
  Keyring,
  WsProvider,
  SubmittableResult,
} from '@polkadot/api'
import { web3FromAddress } from '@polkadot/extension-dapp'

type AssetDTO = {
  name: string
  owner: string
  meta: string | null
}
type Asset = {
  name: string
  owner: string
  meta: Record<string, any> | null
}

type Assets = { hash: string; asset: Asset }[]

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

  async get(hash: string): Promise<Asset> {
    const entry = await this.api.query.metaAssets.assetsStore(hash)
    const asset = entry?.toHuman() as AssetDTO
    asset.meta = asset.meta ? JSON.parse(asset.meta) : null
    return asset as Asset
  }

  async getMultiple(...hashes: string[]): Promise<Asset[]> {
    const assets = await this.api.query.metaAssets.assetsStore(hashes)
    return (assets?.toHuman() as AssetDTO[])?.map((asset) => {
      asset.meta = asset.meta ? JSON.stringify(asset.meta) : null
      return asset as Asset
    })
  }

  async getAll(): Promise<Assets> {
    const entries = await this.api.query.metaAssets.assetsStore.entries()
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string]
      const asset = val?.[1]?.toHuman() as AssetDTO
      asset.meta = asset.meta ? JSON.parse(asset.meta) : null
      return { hash: key[0], asset: asset as Asset }
    })
  }

  async add(
    asset: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false,
    meta: Record<string, any> | null = null
  ) {
    if (devAccount) {
      const keyring = new Keyring({ type: 'sr25519' })
      return this.api.tx.metaAssets
        .addAsset(asset, meta ? JSON.stringify(meta) : null)
        .signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return this.api.tx.metaAssets
      .addAsset(asset, meta ? JSON.stringify(meta) : null)
      .signAndSend(address, { signer: injector.signer }, handler)
  }

  async updateMeta(
    hash: string,
    meta: Record<string, any> | null,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (devAccount) {
      const keyring = new Keyring({ type: 'sr25519' })
      return this.api.tx.metaAssets
        .updateMeta(hash, meta ? JSON.stringify(meta) : null)
        .signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return this.api.tx.metaAssets
      .updateMeta(hash, meta ? JSON.stringify(meta) : null)
      .signAndSend(address, { signer: injector.signer }, handler)
  }

  async transfer(
    hash: string,
    destinationAddress: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (devAccount) {
      const keyring = new Keyring({ type: 'sr25519' })
      return this.api.tx.metaAssets
        .transferAsset(hash, destinationAddress)
        .signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return this.api.tx.metaAssets
      .transferAsset(hash, destinationAddress)
      .signAndSend(address, { signer: injector.signer }, handler)
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
