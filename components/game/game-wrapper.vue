<template>
  <h2>
    Status:
    <span v-if="winner === PLAYER.FIRST"> 'X' player wins </span>
    <span v-else-if="winner === PLAYER.SECOND"> 'O' player wins </span>
    <span v-else-if="winner === 'tie'">Tie</span>
  </h2>
  <canvas id="game-canvas" :height="MAX_SIZE" :width="MAX_SIZE"></canvas>
  <n-button type="warning" style="width: 100%" @click="resetGame">
    Reset game
  </n-button>
</template>
<script setup lang="ts">
import { NButton } from 'naive-ui'
import { $obtain } from '@kodadot1/minipfs'
import { type Asset, AssetsManager } from '@/plugins/assets-pallet'

const notificationStore = useNotificationStore()

const props = defineProps<{
  assetHash: string
}>()
const context = ref<CanvasRenderingContext2D | null>(null)

const MAX_SIZE = 600

const FIELD_SIZE = MAX_SIZE / 3

enum PLAYER {
  FIRST = 1,
  SECOND = 2,
}

type Field = {
  x: number
  y: number
  value: PLAYER | null
}

const playfield = ref<Field[]>([])

const playerId = ref(1)

watch(
  () => playfield.value,
  () => {
    if (context.value) {
      rerender(context.value as CanvasRenderingContext2D)
      checkForWin()
    }
  },
  {
    deep: true,
  }
)

const { $assets } = useNuxtApp()

type TicTacAsset = Asset & {
  meta: {
    ipfs_x: string
    ipfs_o: string
  }
}

const asset = ref<TicTacAsset | null>(null)
const xImage = ref<CanvasImageSource | null>(null)
const oImage = ref<CanvasImageSource | null>(null)

watch(
  () => props.assetHash,
  async (value) => {
    if (props.assetHash === 'default') {
      asset.value = null
    } else {
      const manager: AssetsManager = await $assets.getManager()

      if (!manager) {
        notificationStore.create(
          'Tic-Tac-Toe',
          "Couldn't load assets manager",
          NotificationType.Error
        )
        return
      }
      const collections = await manager.getCollections()

      const ticTacToeCollection = collections.find(
        (collection) => collection.name === 'tic-tac-toe'
      )
      if (!ticTacToeCollection) return
      const _asset = await manager.getAsset(value, ticTacToeCollection.hash)
      if (!_asset) return
      asset.value = _asset as TicTacAsset
      const xUrl: Blob | null = await $obtain(asset.value.meta.ipfs_x, [
        'infura_kodadot1',
      ])
      const oUrl: Blob | null = await $obtain(asset.value.meta.ipfs_o, [
        'infura_kodadot1',
      ])

      if (!xUrl || !oUrl) return
      xImage.value = new Image()
      xImage.value.src = URL.createObjectURL(xUrl)
      xImage.value.addEventListener('load', () => {
        if (context.value) {
          rerender(context.value as CanvasRenderingContext2D)
        }
      })

      oImage.value = new Image()
      oImage.value.src = URL.createObjectURL(oUrl)
      oImage.value.addEventListener('load', () => {
        if (context.value) {
          rerender(context.value as CanvasRenderingContext2D)
        }
      })
    }
    if (context.value) {
      rerender(context.value as CanvasRenderingContext2D)
    }
  }
)

const winner = ref<PLAYER | null | 'tie'>(null)

const resetGame = () => {
  playfield.value = []
  winner.value = null
  playerId.value = 1
  for (let xIndex = 0; xIndex < 3; xIndex++) {
    for (let yIndex = 0; yIndex < 3; yIndex++) {
      playfield.value.push({
        x: FIELD_SIZE * xIndex,
        y: FIELD_SIZE * yIndex,
        value: null,
      })
    }
  }
}
const checkForWin = () => {
  const isFull = playfield.value.filter((field) => field.value === null)
  if (isFull.length === 0) {
    winner.value = 'tie'
    return
  }
  // First check vertical win
  for (let xIndex = 0; xIndex < 3; xIndex++) {
    const inX = playfield.value.filter(
      (field) =>
        field.x >= FIELD_SIZE * xIndex &&
        field.x < FIELD_SIZE * (xIndex + 1) &&
        field.value !== null
    )
    if (inX.length === 3) {
      const nP1 = inX.filter((field) => field.value === PLAYER.FIRST)
      if (nP1.length === 3) {
        winner.value = PLAYER.FIRST
        break
      }

      const nP2 = inX.filter((field) => field.value === PLAYER.SECOND)
      if (nP2.length === 3) {
        winner.value = PLAYER.SECOND
        break
      }
    }
  }
  if (winner.value) return

  // Now check horizontal win
  for (let yIndex = 0; yIndex < 3; yIndex++) {
    const inY = playfield.value.filter(
      (field) =>
        field.y >= FIELD_SIZE * yIndex &&
        field.y < FIELD_SIZE * (yIndex + 1) &&
        field.value !== null
    )
    if (inY.length === 3) {
      const nP1 = inY.filter((field) => field.value === PLAYER.FIRST)
      if (nP1.length === 3) {
        winner.value = PLAYER.FIRST
      }

      const nP2 = inY.filter((field) => field.value === PLAYER.SECOND)
      if (nP2.length === 3) {
        winner.value = PLAYER.SECOND
        break
      }
    }
  }

  if (winner.value) return
  // Check for cross win
  const cross1 = playfield.value.filter(
    (field) => field.x === field.y && field.value !== null
  )
  if (cross1.length === 3) {
    const nP1 = cross1.filter((field) => field.value === PLAYER.FIRST)
    if (nP1.length === 3) {
      winner.value = PLAYER.FIRST
    }

    const nP2 = cross1.filter((field) => field.value === PLAYER.SECOND)
    if (nP2.length === 3) {
      winner.value = PLAYER.SECOND
    }
  }

  if (winner.value) return

  const cross2 = playfield.value.filter(
    (field) =>
      field.x + field.y === MAX_SIZE - FIELD_SIZE && field.value !== null
  )
  if (cross2.length === 3) {
    const nP1 = cross2.filter((field) => field.value === PLAYER.FIRST)
    if (nP1.length === 3) {
      winner.value = PLAYER.FIRST
    }

    const nP2 = cross2.filter((field) => field.value === PLAYER.SECOND)
    if (nP2.length === 3) {
      winner.value = PLAYER.SECOND
    }
  }
}

const rerender = (ctx: CanvasRenderingContext2D) => {
  clearArea(ctx)
  for (const field of playfield.value) {
    const x = field.x + FIELD_SIZE / 2
    const y = field.y + FIELD_SIZE / 2

    if (field.value === PLAYER.FIRST) {
      if (!asset.value || !xImage.value) {
        ctx.beginPath()
        ctx.moveTo(x - FIELD_SIZE / 2 + 5, y - FIELD_SIZE / 2 + 5)
        ctx.lineTo(x + FIELD_SIZE / 2 - 5, y + FIELD_SIZE / 2 - 5)
        ctx.moveTo(x + FIELD_SIZE / 2 - 5, y - FIELD_SIZE / 2 + 5)
        ctx.lineTo(x - FIELD_SIZE / 2 + 5, y + FIELD_SIZE / 2 - 5)
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      } else {
        ctx.drawImage(
          xImage.value as CanvasImageSource,
          x - FIELD_SIZE / 2,
          y - FIELD_SIZE / 2,
          FIELD_SIZE,
          FIELD_SIZE
        )
      }
    } else if (field.value === PLAYER.SECOND) {
      if (!asset.value || !oImage.value) {
        ctx.beginPath()
        ctx.arc(x, y, FIELD_SIZE / 2 - 5, 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      } else {
        ctx.drawImage(
          oImage.value as CanvasImageSource,
          x - FIELD_SIZE / 2,
          y - FIELD_SIZE / 2,
          FIELD_SIZE,
          FIELD_SIZE
        )
      }
    }
  }
}

const clearArea = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, MAX_SIZE, MAX_SIZE)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE)
  // Render basic tic tac toe grid
  ctx.beginPath()
  ctx.moveTo(MAX_SIZE / 3, 0)
  ctx.lineTo(MAX_SIZE / 3, MAX_SIZE)

  ctx.moveTo((MAX_SIZE / 3) * 2, 0)
  ctx.lineTo((MAX_SIZE / 3) * 2, MAX_SIZE)

  ctx.moveTo(0, MAX_SIZE / 3)
  ctx.lineTo(MAX_SIZE, MAX_SIZE / 3)

  ctx.moveTo(0, (MAX_SIZE / 3) * 2)
  ctx.lineTo(MAX_SIZE, (MAX_SIZE / 3) * 2)

  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

const onClickHandler = (e: MouseEvent) => {
  if (winner.value) return
  const x = e.offsetX
  const y = e.offsetY

  const field = playfield.value.find((f) => {
    const inXRange = x > f.x && x < f.x + FIELD_SIZE
    const inYRange = y > f.y && y < f.y + FIELD_SIZE
    return inXRange && inYRange
  })

  if (field && field.value === null) {
    field.value = playerId.value
    if (playerId.value === PLAYER.FIRST) {
      playerId.value = PLAYER.SECOND
    } else {
      playerId.value = PLAYER.FIRST
    }
  }
}

onMounted(() => {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  if (ctx) {
    context.value = ctx
    clearArea(ctx)
    canvas.addEventListener('click', onClickHandler)
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        playfield.value.push({
          x: x * FIELD_SIZE,
          y: y * FIELD_SIZE,
          value: null,
        })
      }
    }
  }
})
</script>
<style scoped lang="scss">
#game-canvas {
  border: 1px solid white;
  margin: 5%;
}
</style>
