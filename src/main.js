import Phaser from 'phaser'
import './style.css'

const WIDTH = 576
const HEIGHT = 1024
const SHOE_SIZE = 500
const SHOE_X = WIDTH / 2
const SHOE_Y = 480
const ASSET_BASE = import.meta.env.BASE_URL

class ShoeCleanerScene extends Phaser.Scene {
  preload() {
    this.load.image('background', `${ASSET_BASE}assets/background.jpg`)
    this.load.image('logo', `${ASSET_BASE}assets/logo-browser.png`)
    this.load.image('dirty', `${ASSET_BASE}assets/dirty.png`)
    this.load.image('clean', `${ASSET_BASE}assets/clean.png`)
    this.load.image('brush', `${ASSET_BASE}assets/brush.png`)
    this.load.image('sponge', `${ASSET_BASE}assets/spong.png`)
    this.load.image('bubbles', `${ASSET_BASE}assets/bubbles.png`)
    this.load.audio('cleaningSound', `${ASSET_BASE}assets/audio/shoe-cleaning-trimmed.wav`)
    this.load.audio('bubblesSound', `${ASSET_BASE}assets/audio/bubbles-browser.wav`)
    this.load.audio('successSound', `${ASSET_BASE}assets/audio/success.wav`)
  }

  create() {
    this.cleanedAmount = 0
    this.gameFinished = false
    this.lastBrushPoint = null
    this.tool = 'sponge'
    this.foamStamps = 0
    this.foamClouds = []
    this.foamTimer = null
    this.lastPointer = null
    this.isPointerHeld = false
    this.createBackground()
    this.createProgress()
    this.createShoe()
    this.createControls()
    this.createAudio()
    this.createBrushCursor()
    this.scale.on('resize', this.handleResize, this)
    this.game.canvas.addEventListener('pointerdown', this.handleCanvasPointerDown)
    this.game.canvas.addEventListener('pointermove', this.handleCanvasPointerMove)
    this.game.canvas.addEventListener('pointerup', this.handleCanvasPointerUp)
    this.game.canvas.addEventListener('pointercancel', this.handleCanvasPointerUp)
    this.game.canvas.addEventListener('mousedown', this.handleCanvasPointerDown)
    this.game.canvas.addEventListener('mousemove', this.handleCanvasPointerMove)
    this.game.canvas.addEventListener('mouseup', this.handleCanvasPointerUp)
    this.handleResize(this.scale)
  }

  createBackground() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'background')
      .setDisplaySize(768, HEIGHT)
      .setDepth(-2)
    this.add.image(SHOE_X, 62, 'logo').setDisplaySize(220, 100)
    this.refreshButton = this.add.text(WIDTH - 36, 48, '↻', {
      color: '#f7f1e8', fontFamily: 'Arial, sans-serif', fontSize: '36px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(4)
    this.refreshButton.on('pointerdown', () => this.resetGame())
    this.status = this.add.text(SHOE_X, 112, 'Scrub the dirt away', {
      color: '#b9d3c8', fontFamily: 'Arial, sans-serif', fontSize: '20px',
    }).setOrigin(0.5)
  }

  createProgress() {
    this.add.rectangle(88, 152, 400, 18, 0x0e292d).setOrigin(0)
    this.progressFill = this.add.rectangle(88, 152, 0, 18, 0xf7d36b).setOrigin(0)
    this.progressLabel = this.add.text(288, 182, '0% clean', {
      color: '#b9d3c8', fontFamily: 'Arial, sans-serif', fontSize: '15px',
    }).setOrigin(0.5)
  }

  createShoe() {
    this.cleanShoe = this.add.image(SHOE_X, SHOE_Y, 'clean').setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.dirtCanvas = this.textures.createCanvas('dirtLayer', 1024, 1024)
    this.dirtCanvas.getContext().drawImage(this.textures.get('dirty').getSourceImage(), 0, 0)
    this.dirtCanvas.refresh()
    this.initialDirtPixels = this.countOpaquePixels(this.dirtCanvas)
    this.dirtyShoe = this.add.image(SHOE_X, SHOE_Y, 'dirtLayer').setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.foamCanvas = this.textures.createCanvas('foamLayer', 1024, 1024)
    this.foamShoe = this.add.image(SHOE_X, SHOE_Y, 'foamLayer')
      .setDisplaySize(SHOE_SIZE, SHOE_SIZE)
      .setAlpha(0)
    this.dirtyShoe.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 1024, 1024),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    })
  }

  createControls() {
    this.brushButton = this.add.image(205, 850, 'brush').setInteractive({ useHandCursor: true })
    this.spongeButton = this.add.image(371, 850, 'sponge').setInteractive({ useHandCursor: true })
    this.brushButton.on('pointerdown', () => this.selectTool('brush'))
    this.spongeButton.on('pointerdown', () => this.selectTool('sponge'))
    document.querySelector('#brush-control').addEventListener('click', () => this.selectTool('brush'))
    document.querySelector('#sponge-control').addEventListener('click', () => this.selectTool('sponge'))
    document.querySelector('#refresh-control').addEventListener('click', () => this.resetGame())
    this.toolLabel = this.add.text(SHOE_X, 942, 'Sponge selected', {
      color: '#f7f1e8', fontFamily: 'Arial, sans-serif', fontSize: '18px',
    }).setOrigin(0.5)
    this.updateToolVisuals()
  }

  createAudio() {
    this.cleaningSound = this.sound.add('cleaningSound', { loop: true, volume: 0.35 })
    this.bubblesSound = this.sound.add('bubblesSound', { loop: true, volume: 0.35 })
    this.successSound = this.sound.add('successSound', { volume: 0.6 })
  }

  resetGame() {
    this.stopCleaning()
    this.foamClouds.forEach((cloud) => cloud.destroy())
    this.foamClouds = []
    this.cleanedAmount = 0
    this.gameFinished = false
    this.lastBrushPoint = null
    this.foamStamps = 0
    this.progressFill.width = 0
    this.progressLabel.setText('0% clean')
    this.status.setText('Apply foam with the sponge')
    this.dirtCanvas.getContext().clearRect(0, 0, 1024, 1024)
    this.dirtCanvas.getContext().drawImage(this.textures.get('dirty').getSourceImage(), 0, 0, 1024, 1024)
    this.dirtCanvas.refresh()
    this.foamCanvas.getContext().clearRect(0, 0, 1024, 1024)
    this.foamCanvas.refresh()
    this.dirtyShoe.setVisible(true)
    this.cleanShoe.setVisible(true)
    this.tool = 'sponge'
    this.brushCursor.setTexture('sponge').setVisible(false)
    this.toolLabel.setText('Sponge selected')
    this.updateToolVisuals()
    this.children.list
      .filter((child) => child !== this.dirtyShoe && child !== this.cleanShoe && child !== this.foamShoe && child !== this.refreshButton && child.type === 'Text' && (child.text === 'CLEAN!' || child.text === 'Perfect!'))
      .forEach((child) => child.destroy())
  }

  createBrushCursor() {
    this.brushCursor = this.add.image(SHOE_X, SHOE_Y, 'sponge').setScale(0.182).setDepth(5).setVisible(false)
  }

  handleCanvasPointerDown = (event) => {
    const pointer = this.getCanvasPointer(event)
    this.moveBrush(pointer)
    if (this.isPointInToolButton(pointer, this.brushButton)) {
      this.selectTool('brush')
      return
    }
    if (this.isPointInToolButton(pointer, this.spongeButton)) {
      this.selectTool('sponge')
      return
    }
    if (this.isPointInRefreshButton(pointer)) {
      this.resetGame()
      return
    }
    this.startCleaning(pointer)
  }

  handleCanvasPointerMove = (event) => {
    const pointer = this.getCanvasPointer(event)
    pointer.isDown = this.isPointerHeld || event.buttons > 0
    this.moveBrush(pointer)
  }

  handleCanvasPointerUp = () => {
    this.stopCleaning()
  }

  getCanvasPointer(event) {
    const bounds = this.game.canvas.getBoundingClientRect()
    return {
      worldX: (event.clientX - bounds.left) / bounds.width * WIDTH,
      worldY: (event.clientY - bounds.top) / bounds.height * HEIGHT,
    }
  }

  isPointInToolButton(pointer, button) {
    return Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, button.x, button.y) < 105
  }

  isPointInRefreshButton(pointer) {
    return Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, WIDTH - 36, 48) < 42
  }

  selectTool(tool) {
    this.tool = tool
    this.toolLabel.setText(`${tool === 'brush' ? 'Brush' : 'Sponge'} selected`)
    this.brushCursor.setTexture(tool === 'brush' ? 'brush' : 'sponge')
    this.updateToolVisuals()
  }

  updateToolVisuals() {
    const selectedScale = 0.22
    const unselectedScale = 0.16
    this.brushButton.setScale(this.tool === 'brush' ? selectedScale : unselectedScale)
    this.spongeButton.setScale(this.tool === 'sponge' ? selectedScale : unselectedScale)
    this.brushButton.setTint(this.tool === 'brush' ? 0xffffff : 0x777777)
    this.spongeButton.setTint(this.tool === 'sponge' ? 0xffffff : 0x777777)
  }

  moveBrush(pointer) {
    this.brushCursor.setPosition(pointer.worldX, pointer.worldY)
    this.brushCursor.setVisible(pointer.worldX > 0 && pointer.worldX < WIDTH && pointer.worldY > 0 && pointer.worldY < HEIGHT)
    if (pointer.isDown) {
      this.lastPointer = { worldX: pointer.worldX, worldY: pointer.worldY }
      if (this.isPointerOnShoe(pointer)) {
        const sound = this.tool === 'sponge' ? this.bubblesSound : this.cleaningSound
        if (!sound.isPlaying) sound.play()
        this.scrub(pointer, false)
      }
      }
  }

  startCleaning(pointer) {
    if (pointer.worldY > 760 && pointer.worldY < 930) {
      if (pointer.worldX < 290) this.selectTool('brush')
      else if (pointer.worldX < 470) this.selectTool('sponge')
      return
    }
    if (!this.isPointerOnShoe(pointer)) return
    this.isPointerHeld = true
    const sound = this.tool === 'sponge' ? this.bubblesSound : this.cleaningSound
    if (!sound.isPlaying) sound.play()
    this.lastPointer = { worldX: pointer.worldX, worldY: pointer.worldY }
    this.foamTimer = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        if (this.isPointerHeld) this.scrub(this.lastPointer, false)
      },
    })
    this.scrub(pointer, true)
  }

  isPointerOnShoe(pointer) {
    const localX = (pointer.worldX - (SHOE_X - SHOE_SIZE / 2)) / SHOE_SIZE * 1024
    const localY = (pointer.worldY - (SHOE_Y - SHOE_SIZE / 2)) / SHOE_SIZE * 1024
    return localX >= 0 && localX <= 1024 && localY >= 0 && localY <= 1024
  }

  stopCleaning() {
    this.isPointerHeld = false
    if (this.cleaningSound.isPlaying) this.cleaningSound.stop()
    if (this.bubblesSound.isPlaying) this.bubblesSound.stop()
    if (this.foamTimer) {
      this.foamTimer.remove()
      this.foamTimer = null
    }
    this.lastPointer = null
    this.lastBrushPoint = null
  }

  scrub(pointer, isNewStroke) {
    if (!pointer || this.gameFinished) return
    const localX = Phaser.Math.Clamp((pointer.worldX - (SHOE_X - SHOE_SIZE / 2)) / SHOE_SIZE * 1024, 0, 1024)
    const localY = Phaser.Math.Clamp((pointer.worldY - (SHOE_Y - SHOE_SIZE / 2)) / SHOE_SIZE * 1024, 0, 1024)
    if (this.tool === 'sponge') {
      this.addFoam(localX, localY)
      this.status.setText('Foam applied - switch to the brush')
      return
    }

    const brushRadius = 108
    this.eraseLayer(this.dirtCanvas, localX, localY, brushRadius, this.lastBrushPoint)
    this.eraseLayer(this.foamCanvas, localX, localY, brushRadius + 10, this.lastBrushPoint)
    this.removeFoamAt(localX, localY)
    this.lastBrushPoint = { x: localX, y: localY }
    this.updateProgress()
    this.status.setText('Keep brushing...')
    if (this.isCanvasEmpty(this.dirtCanvas)) this.finishCleaning()
  }

  addFoam(localX, localY) {
    if (this.foamStamps >= 240) return
    const bubblesPerStroke = 4
    for (let index = 0; index < bubblesPerStroke; index += 1) {
      const size = Phaser.Math.Between(245, 330)
      const offsetX = Phaser.Math.Between(-105, 105)
      const offsetY = Phaser.Math.Between(-105, 105)
      const cloudX = localX + offsetX
      const cloudY = localY + offsetY
      if (!this.isInsideShoe(cloudX, cloudY)) continue
      const cloud = this.add.container(
        SHOE_X - SHOE_SIZE / 2 + cloudX / 1024 * SHOE_SIZE,
        SHOE_Y - SHOE_SIZE / 2 + cloudY / 1024 * SHOE_SIZE,
      ).setDepth(2)
      const cloudSize = size / 1024 * SHOE_SIZE
      const cloudShape = this.add.graphics()
      cloudShape.fillStyle(0xffffff, 0.3)
      cloudShape.fillCircle(-cloudSize * 0.18, 0, cloudSize * 0.28)
      cloudShape.fillCircle(cloudSize * 0.16, -cloudSize * 0.08, cloudSize * 0.34)
      cloudShape.fillCircle(0, cloudSize * 0.14, cloudSize * 0.25)
      cloud.add(cloudShape)
      cloud.add(this.add.image(0, 0, 'bubbles').setDisplaySize(cloudSize, cloudSize).setAlpha(0.72))
      this.foamClouds.push(cloud)
    }
    this.foamStamps += 1
  }

  isInsideShoe(localX, localY) {
    const horizontal = (localX - 512) / 500
    const vertical = (localY - 512) / 315
    return horizontal * horizontal + vertical * vertical <= 1
  }

  removeFoamAt(localX, localY) {
    const worldX = SHOE_X - SHOE_SIZE / 2 + localX / 1024 * SHOE_SIZE
    const worldY = SHOE_Y - SHOE_SIZE / 2 + localY / 1024 * SHOE_SIZE
    this.foamClouds = this.foamClouds.filter((cloud) => {
      if (Phaser.Math.Distance.Between(worldX, worldY, cloud.x, cloud.y) < 78) {
        cloud.destroy()
        return false
      }
      return true
    })
  }

  isCanvasEmpty(canvasTexture) {
    return this.countOpaquePixels(canvasTexture) === 0
  }

  countOpaquePixels(canvasTexture) {
    const pixels = canvasTexture.getContext().getImageData(0, 0, 1024, 1024).data
    let opaquePixels = 0
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) opaquePixels += 1
    }
    return opaquePixels
  }

  updateProgress() {
    const remainingPixels = this.countOpaquePixels(this.dirtCanvas)
    const cleanedPixels = this.initialDirtPixels - remainingPixels
    this.cleanedAmount = Math.min(99, cleanedPixels / this.initialDirtPixels * 100)
    this.progressFill.width = 400 * this.cleanedAmount / 100
    this.progressLabel.setText(`${Math.floor(this.cleanedAmount)}% clean`)
  }

  eraseLayer(canvasTexture, localX, localY, radius, previousPoint = null) {
    const context = canvasTexture.getContext()
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = radius * 2
    context.beginPath()
    if (previousPoint) {
      context.moveTo(previousPoint.x, previousPoint.y)
      context.lineTo(localX, localY)
      context.stroke()
    } else {
      context.arc(localX, localY, radius, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()
    canvasTexture.refresh()
  }

  finishCleaning() {
    if (this.gameFinished) return
    this.gameFinished = true
    this.stopCleaning()
    this.foamClouds.forEach((cloud) => cloud.destroy())
    this.foamClouds = []
    this.foamCanvas.getContext().clearRect(0, 0, 1024, 1024)
    this.foamCanvas.refresh()
    this.dirtyShoe.setVisible(false)
    this.progressFill.width = 400
    this.progressLabel.setText('100% clean')
    this.successSound.play()
    this.createConfetti()
    this.status.setText('Perfect!')
    this.add.text(SHOE_X, 235, 'CLEAN!', {
      color: '#f7d36b', fontFamily: 'Georgia, serif', fontSize: '58px', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3)
  }

  createConfetti() {
    const colors = [0xf7d36b, 0xe87d72, 0x8bc6a8, 0x7da7d9, 0xf7f1e8]
    for (let index = 0; index < 34; index += 1) {
      const piece = this.add.rectangle(SHOE_X, 270, Phaser.Math.Between(7, 13), Phaser.Math.Between(12, 22), Phaser.Utils.Array.GetRandom(colors))
        .setDepth(6)
      this.tweens.add({
        targets: piece,
        x: SHOE_X + Phaser.Math.Between(-245, 245),
        y: Phaser.Math.Between(430, 820),
        angle: Phaser.Math.Between(-300, 300),
        alpha: 0,
        duration: Phaser.Math.Between(1600, 2400),
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      })
    }
  }

  handleResize(gameSize) {
    const scale = Math.min(gameSize.width / WIDTH, gameSize.height / HEIGHT)
    this.cameras.main.setZoom(scale)
    this.cameras.main.centerOn(SHOE_X, HEIGHT / 2)
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    width: WIDTH,
    height: HEIGHT,
  },
  scene: ShoeCleanerScene,
})
