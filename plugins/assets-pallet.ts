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

  public static async get(): Promise<AssetsManager> {
    if (!this.instance) {
      const wsProvider = new WsProvider('ws://localhost:9944')
      const api = await ApiPromise.create({ provider: wsProvider })
      AssetsManager.instance = new AssetsManager(api)
    }
    return this.instance!
  }

  get(asset: string) {
    return this.api.query.metaAssets.assetsStore(asset)
  }

  geMultiple(...asset: string[]) {
    return this.api.query.metaAssets.assetsStore(asset)
  }

  async getAll() {
    const entries = await this.api.query.metaAssets.assetsStore.entries()
    return entries?.map((val) => val?.[1]?.toHuman())
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
