import {
  ApiPromise,
  Keyring,
  WsProvider,
  SubmittableResult,
} from '@polkadot/api'
import { web3FromAddress } from '@polkadot/extension-dapp'

type Meta = Record<string, any>

type AssetDTO = {
  name: string
  owner: string
}
type Asset = {
  name: string
  owner: string
  meta: Record<string, Meta>
}

type Assets = { hash: string; asset: Asset }[]

type MetaData = { hash: string; owner: string; meta: Meta | null }[]

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

  async getAsset(hash: string, adminAddress: string | null): Promise<Asset> {
    const entry = await this.api.query.metaAssets.assetsStore(hash)
    const asset = entry?.toHuman() as AssetDTO
    const allMeta = await this.getAllMetadata()
    const sameMeta = allMeta.filter((m) => m.hash === hash)!
    if (adminAddress) {
      const adminMeta = sameMeta.find((m) => m.owner === adminAddress)
      if (adminMeta) {
        return {
          name: asset.name,
          owner: asset.owner,
          meta: { [adminAddress]: adminMeta.meta! },
        }
      }
    }
    return {
      name: asset.name,
      owner: asset.owner,
      meta: sameMeta.reduce((acc, m) => {
        acc[m.owner] = m.meta!
        return acc
      }, {} as Record<string, Meta>),
    }
  }

  async getAllAssets(): Promise<Assets> {
    const data = await this.getAllMetadata()
    const entries = await this.api.query.metaAssets.assetsStore.entries()
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string]
      const asset = val?.[1]?.toHuman() as AssetDTO
      const transformed = {
        name: asset.name,
        owner: asset.owner,
        meta: {},
      } as Asset
      const sameMeta = data.filter((m) => m.hash === key[0])!
      sameMeta.forEach((m) => {
        transformed.meta[m.owner] = m.meta!
      })
      return { hash: key[0], asset: transformed }
    })
  }

  async getAllMetadata(): Promise<MetaData> {
    const entries = await this.api.query.metaAssets.metadataStore.entries()
    return entries?.map((val) => {
      const key = val?.[0]?.toHuman() as [string, string]
      const metaJSON = val?.[1]?.toHuman() as string | null
      return {
        hash: key[0],
        owner: key[1],
        meta: metaJSON ? JSON.parse(metaJSON) : null,
      }
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

  async registerAdmin(
    hash: string,
    adminAddress: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (devAccount) {
      const keyring = new Keyring({ type: 'sr25519' })
      return this.api.tx.metaAssets
        .registerAdmin(hash, adminAddress)
        .signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return this.api.tx.metaAssets
      .registerAdmin(hash, adminAddress)
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
