import {
  ApiPromise,
  Keyring,
  WsProvider,
  SubmittableResult,
} from '@polkadot/api'
import { web3FromAddress } from '@polkadot/extension-dapp'

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

  async get(hash: string) {
    const asset = await this.api.query.metaAssets.assetsStore(hash)
    return asset?.toHuman()
  }

  async getMultiple(...hashes: string[]) {
    const assets = await this.api.query.metaAssets.assetsStore(hashes)
    return assets?.toHuman()
  }

  async getAll() {
    const entries = await this.api.query.metaAssets.assetsStore.entries()
    return entries?.map((val) => [val?.[0]?.toHuman(), val?.[1]?.toHuman()])
  }

  async add(
    asset: string,
    address: string,
    handler: (res: SubmittableResult) => void,
    devAccount = false
  ) {
    if (devAccount) {
      const keyring = new Keyring({ type: 'sr25519' })
      return this.api.tx.metaAssets
        .addAsset(asset)
        .signAndSend(keyring.createFromUri(address), handler)
    }
    const injector = await web3FromAddress(address)
    return this.api.tx.metaAssets
      .addAsset(asset)
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
