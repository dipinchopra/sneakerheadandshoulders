import Phaser from 'phaser'
import './style.css'
import clothUrl from '../Game Assets/Art Assets/cloth.png?url'
import coinUrl from '../Game Assets/Art Assets/coin.png?url'
import clothSfxUrl from '../Game Assets/audio/cloth.wav?url'

const WIDTH = 576
const HEIGHT = 1024
const SHOE_SIZE = 500
const SHOE_X = WIDTH / 2
const SHOE_Y = 480
const SPONGE_TARGET = 100
const FOAM_STEP = 0.6
const BRUSH_RADIUS = 46
const CLOTH_RADIUS = 78
const STAGES = [
  { key: 'sponge', label: 'SOAP', reward: 10, end: 25 },
  { key: 'brush', label: 'SCRUB', reward: 15, end: 50 },
  { key: 'cloth', label: 'WIPE', reward: 25, end: 100 },
]
const BASE = import.meta.env.BASE_URL
const asset = (path) => `${BASE}${path.split('/').map(encodeURIComponent).join('/')}`
new FontFace('Mochiy Pop One', `url(${asset('assets/UI Assets/Font/Mochiy_Pop_One/MochiyPopOne-Regular.ttf')})`).load()
  .then((font) => document.fonts.add(font))

const shoes = [1, 2, 3, 4].map((number) => ({
  clean: asset(`assets/Art Assets/Shoes/${number}./clean.png`),
  dirty: asset(`assets/Art Assets/Shoes/${number}./dirty.png`),
}))

const files = {
  loadingBg: 'assets/UI Assets/Loading Screen/loading bg.png',
  loadingLogo: 'assets/UI Assets/Loading Screen/logo.png',
  loadingEmpty: 'assets/UI Assets/Loading Screen/Loading Bar Empty.png',
  loadingFull: 'assets/UI Assets/Loading Screen/Loading Bar Full.png',
  startBg: 'assets/UI Assets/Game Start/game start bg.png',
  startLogo: 'assets/UI Assets/Game Start/logo.png',
  play: 'assets/UI Assets/Game Start/Play Button.png',
  close: 'assets/UI Assets/Game Start/Close.png',
  gameplayBg: 'assets/UI Assets/Gameplay/image 79.png',
  gameplayPause: 'assets/UI Assets/Gameplay/Group 1079.png',
  progressEmpty: 'assets/UI Assets/Gameplay/Progress Bar Empty.png',
  progressFull: 'assets/UI Assets/Gameplay/Progress Bar Full.png',
  pauseBg: 'assets/UI Assets/Game Modal/Menu background.png',
  pauseLogo: 'assets/UI Assets/Game Modal/logo.png',
  pauseClose: 'assets/UI Assets/Game Modal/Close.png',
  pauseRestart: 'assets/UI Assets/Game Modal/Restart.png',
  pauseQuit: 'assets/UI Assets/Game Modal/Quit.png',
  quitBg: 'assets/UI Assets/Game Quit popup/Menu background.png',
  quitClose: 'assets/UI Assets/Game Quit popup/Close.png',
  quitCancel: 'assets/UI Assets/Game Quit popup/Cancel Button.png',
  quitConfirm: 'assets/UI Assets/Game Quit popup/Quit.png',
  resultBg: 'assets/UI Assets/Game Result/Result Background.png',
  resultLogo: 'assets/UI Assets/Game Result/logo.png',
  resultClose: 'assets/UI Assets/Game Result/Close.png',
  resultNext: 'assets/UI Assets/Game Result/Next Round.png',
  resultRestart: 'assets/UI Assets/Game Result/Restart.png',
  brush: 'assets/Art Assets/brush.png',
  sponge: 'assets/Art Assets/spong.png',
  bubbles: 'assets/Art Assets/bubbles.png',
  sparkle: 'assets/Art Assets/sparkle.png',
}

const audioFiles = {
  menu: 'assets/audio/menu-bg-v2.wav',
  gameplay: 'assets/audio/gameplay-bg-v2.wav',
  click: 'assets/audio/ui-click-v2.wav',
  cleaning: 'assets/audio/shoe-cleaning-v2.wav',
  bubbles: 'assets/audio/bubbles-v2.wav',
  success: 'assets/audio/success-v2.wav',
  clothSfx: clothSfxUrl,
}

class AudioManager {
  constructor(scene) {
    this.scene = scene
    this.enabled = true
    this.music = null
  }

  sound(key, config = {}) {
    const sound = this.scene.sound.add(key, config)
    sound.setMute(!this.enabled)
    return sound
  }

  playClick() {
    if (this.enabled) this.scene.sound.play('click', { volume: 0.8 })
  }

  setEnabled(enabled) {
    this.enabled = enabled
    this.scene.sound.setMute(!enabled)
  }

  playMusic(key) {
    if (this.music?.key === key && this.music.isPlaying) return
    this.stopMusic()
    this.music = this.scene.sound.add(key, { loop: true, volume: 0.06 })
    this.music.play()
  }

  stopMusic() {
    if (this.music) {
      this.music.stop()
      this.music.destroy()
      this.music = null
    }
  }
}

class LoadingScene extends Phaser.Scene {
  constructor() { super('LoadingScene') }

  preload() {
    this.load.image('loadingBg', asset(files.loadingBg))
    this.load.image('loadingLogo', asset(files.loadingLogo))
    this.load.image('loadingEmpty', asset(files.loadingEmpty))
    this.load.image('loadingFull', asset(files.loadingFull))
  }

  create() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'loadingBg').setDisplaySize(WIDTH, HEIGHT)
    this.add.image(WIDTH / 2, 350, 'loadingLogo').setDisplaySize(260, 260)
    this.add.image(WIDTH / 2, 785, 'loadingEmpty').setDisplaySize(430, 42)
    this.loadingFill = this.add.image(73, 785, 'loadingFull').setOrigin(0, 0.5).setDisplaySize(430, 42)
    this.loadingFill.setCrop(0, 0, 0, 88)
    this.loadingText = this.add.text(WIDTH / 2, 735, 'Loading...', { fontFamily: 'Mochiy Pop One', fontSize: '22px', color: '#fff' }).setOrigin(0.5)
    this.percentText = this.add.text(WIDTH / 2, 830, '0%', { fontFamily: 'Mochiy Pop One', fontSize: '20px', color: '#fff' }).setOrigin(0.5)
    this.loadAssets()
  }

  loadAssets() {
    Object.entries(files).forEach(([key, path]) => {
      if (!this.textures.exists(key)) this.load.image(key, asset(path))
    })
    this.load.image('cloth', clothUrl)
    this.load.image('coin', coinUrl)
    this.load.image('shoe0Clean', shoes[0].clean)
    this.load.image('shoe0Dirty', shoes[0].dirty)
    Object.entries(audioFiles).forEach(([key, path]) => this.load.audio(key, asset(path)))
    this.load.on('progress', (value) => {
      const percent = Math.floor(value * 100)
      this.percentText.setText(`${percent}%`)
      this.loadingFill.setCrop(0, 0, 924 * value, 88)
    })
    this.load.once('complete', () => this.scene.start('GameScene'))
    this.load.start()
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  addPressFeedback(button) {
    button.on('pointerdown', () => {
      const { scaleX, scaleY } = button
      this.tweens.killTweensOf(button)
      this.tweens.add({ targets: button, scaleX: scaleX * 0.91, scaleY: scaleY * 0.91, duration: 65, yoyo: true, ease: 'Quad.easeOut' })
    })
    return button
  }

  create() {
    this.audio = new AudioManager(this)
    this.roundIndex = 0
    this.state = 'start'
    this.soundEnabled = true
    this.totalCoins = 0
    this.createCoinFallback()
    this.showStart()
    this.input.on('pointerup', () => this.releaseCleaning())
    this.scale.on('resize', this.resize, this)
    this.resize(this.scale)
  }

  createCoinFallback() {
    if (this.textures.exists('coin')) return
    const graphics = this.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(0xffc928).fillCircle(28, 28, 27)
    graphics.lineStyle(4, 0xff8d17).strokeCircle(28, 28, 24)
    graphics.fillStyle(0xffed72).fillCircle(22, 20, 9)
    graphics.generateTexture('coin', 56, 56)
    graphics.destroy()
  }

  clearScene() {
    this.input.off('pointerdown', this.beginCleaning, this)
    this.input.off('pointermove', this.moveCleaning, this)
    this.events.off('update', this.updateGame, this)
    this.children.removeAll(true)
  }

  showStart() {
    this.clearScene()
    this.state = 'start'
    this.audio.playMusic('menu')
    const startBackground = this.add.image(WIDTH / 2, HEIGHT / 2, 'startBg').setDisplaySize(WIDTH, HEIGHT).setInteractive()
    // Browsers unlock audio on the first touch/click, so retry the start music then.
    startBackground.on('pointerdown', () => this.audio.playMusic('menu'))
    this.add.image(WIDTH / 2, 340, 'startLogo').setDisplaySize(260, 260)
    const play = this.add.image(WIDTH / 2, 815, 'play').setDisplaySize(230, 98).setInteractive()
      .on('pointerdown', () => { this.audio.playClick(); this.startRound(0) })
    this.addPressFeedback(play)
    this.add.image(545, 45, 'close').setDisplaySize(34, 34)
  }

  startRound(index) {
    if (!this.textures.exists(`shoe${index}Clean`) || !this.textures.exists(`shoe${index}Dirty`)) {
      this.loadRoundAssets(index, () => this.startRound(index))
      return
    }
    this.roundIndex = index
    this.clearScene()
    this.state = 'gameplay'
    this.cleanedAmount = 0
    this.stageIndex = 0
    this.roundCoins = 0
    this.completedStages = new Set()
    this.startTime = this.time.now
    this.pausedAt = 0
    this.pauseStartedAt = 0
    this.lastBrushPoint = null
    this.lastFoamPoint = null
    this.foamClouds = []
    this.foamCoverage = 0
    this.isPointerHeld = false
    this.audio.playMusic('gameplay')
    this.createGameplay()
  }

  loadRoundAssets(index, onComplete) {
    this.state = 'loading'
    this.load.image(`shoe${index}Clean`, shoes[index].clean)
    this.load.image(`shoe${index}Dirty`, shoes[index].dirty)
    this.load.once('complete', onComplete)
    this.load.start()
  }

  createGameplay() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'gameplayBg').setDisplaySize(WIDTH, HEIGHT)
    this.pauseButton = this.add.image(530, 46, 'gameplayPause').setDisplaySize(44, 44).setInteractive()
      .on('pointerdown', () => { this.audio.playClick(); this.openPause() })
    this.addPressFeedback(this.pauseButton)
    this.progressBg = this.add.image(WIDTH / 2, 142, 'progressEmpty').setDisplaySize(430, 42)
    this.progressFull = this.add.image(73, 142, 'progressFull').setOrigin(0, 0.5).setDisplaySize(430, 42)
    this.progressFull.setCrop(0, 0, 0, 88)
    this.createStageProgress()
    this.cleanShoe = this.add.image(SHOE_X, SHOE_Y, `shoe${this.roundIndex}Clean`).setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.dirtCanvas = this.textures.createCanvas(`dirt-${Date.now()}`, 1024, 1024)
    this.dirtCanvas.getContext().drawImage(this.textures.get(`shoe${this.roundIndex}Dirty`).getSourceImage(), 0, 0, 1024, 1024)
    this.dirtCanvas.refresh()
    this.initialDirtPixels = this.countOpaquePixels(this.dirtCanvas)
    this.dirtyShoe = this.add.image(SHOE_X, SHOE_Y, this.dirtCanvas.key).setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.foamClouds = []
    this.createToolCards()
    this.tool = 'sponge'
    this.toolLabel = this.add.text(WIDTH / 2, 965, 'Add soap with the sponge', { fontFamily: 'Mochiy Pop One', fontSize: '16px', color: '#fff' }).setOrigin(0.5)
    this.coinIcon = this.add.image(46, 66, 'coin').setDisplaySize(38, 38).setDepth(8)
    this.coinText = this.add.text(72, 66, String(this.totalCoins), { fontFamily: 'Mochiy Pop One', fontSize: '19px', color: '#fff', stroke: '#70400b', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(8)
    this.cursor = this.add.image(SHOE_X, SHOE_Y, 'sponge').setScale(0.182).setDepth(6).setVisible(false)
    this.updateToolVisuals()
    // Music sits deliberately behind the action; cleaning is the main tactile feedback.
    this.cleaningSound = this.audio.sound('cleaning', { loop: true, volume: 1 })
    this.bubblesSound = this.audio.sound('bubbles', { loop: true, volume: 1 })
    this.lastClothSfxAt = 0
    this.events.on('update', this.updateGame, this)
    this.input.on('pointerdown', this.beginCleaning, this)
    this.input.on('pointermove', this.moveCleaning, this)
  }

  createToolCards() {
    this.toolCards = {}
    const positions = { sponge: 105, brush: 288, cloth: 471 }
    STAGES.forEach((stage, index) => {
      const container = this.add.container(positions[stage.key], 850).setSize(148, 138).setInteractive()
      const background = this.add.graphics()
      const icon = this.add.image(0, -12, stage.key).setDisplaySize(82, 82)
      const label = this.add.text(0, 48, stage.label, { fontFamily: 'Mochiy Pop One', fontSize: '13px', color: '#fff' }).setOrigin(0.5)
      const status = this.add.text(54, -48, index === 0 ? '' : '🔒', { fontFamily: 'Arial', fontSize: '18px', color: '#fff' }).setOrigin(0.5)
      container.add([background, icon, label, status])
      container.on('pointerdown', () => this.selectTool(stage.key))
      this.addPressFeedback(container)
      this.toolCards[stage.key] = { container, background, icon, status, index }
    })
  }

  createStageProgress() {
    this.stageTicks = []
    const starts = [73, 73 + 430 * 0.25, 73 + 430 * 0.5]
    const widths = [430 * 0.25, 430 * 0.25, 430 * 0.5]
    STAGES.forEach((stage, index) => {
      if (index > 0) this.add.rectangle(starts[index], 142, 3, 34, 0xffffff, 0.9)
      this.add.text(starts[index] + widths[index] / 2, 115, stage.label, { fontFamily: 'Mochiy Pop One', fontSize: '11px', color: '#fff', stroke: '#163f5d', strokeThickness: 3 }).setOrigin(0.5)
      this.stageTicks.push(this.add.text(starts[index] + widths[index] - 13, 142, '✓', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '21px', color: '#fff', stroke: '#16883c', strokeThickness: 5 }).setOrigin(0.5).setVisible(false))
    })
    this.progressLabel = this.add.text(WIDTH / 2, 175, 'SOAP • 0%', { fontFamily: 'Mochiy Pop One', fontSize: '14px', color: '#fff', stroke: '#163f5d', strokeThickness: 3 }).setOrigin(0.5)
  }

  updateGame(_time, delta) {
    if (this.state !== 'gameplay') return
    this.elapsed = Math.max(0, this.time.now - this.startTime - this.pausedAt)
  }

  selectTool(tool) {
    if (this.state !== 'gameplay') return
    const selectedIndex = STAGES.findIndex((stage) => stage.key === tool)
    if (selectedIndex > this.stageIndex) {
      this.toolLabel.setText(`${STAGES[selectedIndex].label} is still locked`)
      return
    }
    if (selectedIndex < this.stageIndex) {
      this.toolLabel.setText(`${STAGES[selectedIndex].label} is already complete`)
      return
    }
    this.tool = tool
    this.awaitingTool = false
    this.cursor.setTexture(tool).setVisible(false)
    this.toolLabel.setText(tool === 'sponge' ? 'Add soap with the sponge' : tool === 'brush' ? 'Scrub the dirt to 50%' : 'Wipe the remaining dirt with the cloth')
    this.updateToolVisuals()
  }

  updateToolVisuals() {
    Object.entries(this.toolCards).forEach(([key, card]) => {
      const complete = card.index < this.stageIndex || this.completedStages.has(card.index)
      const locked = card.index > this.stageIndex
      const active = key === this.tool && !this.awaitingTool
      card.background.clear()
      card.background.fillStyle(active ? 0x1d90d0 : complete ? 0x218f55 : locked ? 0x405466 : 0x274f70, 0.96)
      card.background.fillRoundedRect(-70, -65, 140, 130, 22)
      card.background.lineStyle(active ? 5 : 3, active ? 0xffe66b : complete ? 0x73e59d : 0x9fc7df, 1)
      card.background.strokeRoundedRect(-70, -65, 140, 130, 22)
      card.icon.setAlpha(locked ? 0.55 : 1)
      card.status.setText(complete ? '✓' : locked ? '🔒' : active ? '' : '!')
      card.status.setColor(complete ? '#8dffad' : active ? '#fff' : '#ffe66b')
      card.container.setScale(active ? 1.04 : 1)
    })
  }

  beginCleaning(pointer) {
    if (this.state !== 'gameplay' || this.awaitingTool || !this.tool || !this.isOnShoe(pointer)) return
    this.isPointerHeld = true
    this.lastPointer = pointer
    const sound = this.tool === 'brush' ? this.cleaningSound : this.tool === 'sponge' ? this.bubblesSound : null
    if (sound && !sound.isPlaying) sound.play()
    this.scrub(pointer)
  }

  moveCleaning(pointer) {
    this.cursor.setPosition(pointer.worldX, pointer.worldY).setVisible(this.state === 'gameplay')
    if (this.isPointerHeld && this.isOnShoe(pointer)) {
      if (this.tool === 'cloth' && (!this.lastSwipePoint || Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.lastSwipePoint.x, this.lastSwipePoint.y) >= 24)) {
        this.playClothSwipe()
        this.lastSwipePoint = { x: pointer.worldX, y: pointer.worldY }
      }
      this.lastPointer = pointer
      this.scrub(pointer)
    }
  }

  releaseCleaning() {
    this.isPointerHeld = false
    this.lastBrushPoint = null
    this.lastFoamPoint = null
    this.lastSwipePoint = null
    this.cleaningSound?.stop()
    this.bubblesSound?.stop()
  }

  isOnShoe(pointer) {
    return pointer.worldX > SHOE_X - SHOE_SIZE / 2 && pointer.worldX < SHOE_X + SHOE_SIZE / 2 && pointer.worldY > SHOE_Y - SHOE_SIZE / 2 && pointer.worldY < SHOE_Y + SHOE_SIZE / 2
  }

  scrub(pointer) {
    if (this.tool === 'sponge') {
      this.addFoam(pointer)
      return
    }
    const localX = Phaser.Math.Clamp((pointer.worldX - (SHOE_X - SHOE_SIZE / 2)) / SHOE_SIZE * 1024, 0, 1024)
    const localY = Phaser.Math.Clamp((pointer.worldY - (SHOE_Y - SHOE_SIZE / 2)) / SHOE_SIZE * 1024, 0, 1024)
    this.eraseLayer(this.dirtCanvas, localX, localY, this.tool === 'cloth' ? CLOTH_RADIUS : BRUSH_RADIUS, this.lastBrushPoint)
    this.foamClouds = this.foamClouds.filter((cloud) => {
      const hit = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cloud.x, cloud.y) < 72
      if (hit) cloud.destroy()
      return !hit
    })
    this.lastBrushPoint = { x: localX, y: localY }
    const remaining = this.countOpaquePixels(this.dirtCanvas)
    const dirtRemoved = (this.initialDirtPixels - remaining) / this.initialDirtPixels * 100
    if (this.tool === 'brush') {
      this.cleanedAmount = Math.min(50, 25 + dirtRemoved * 0.5)
      if (dirtRemoved >= 50) this.finishStage()
    } else {
      this.cleanedAmount = Math.min(100, 50 + Math.max(0, dirtRemoved - 50))
      if (remaining === 0 || dirtRemoved >= 99.7) this.finishStage()
    }
    this.updateProgress()
  }

  addFoam(pointer) {
    if (this.lastFoamPoint && Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.lastFoamPoint.x, this.lastFoamPoint.y) < 14) return
    if (this.foamClouds.length >= 240) return
    const x = Phaser.Math.Clamp(pointer.worldX, SHOE_X - 235, SHOE_X + 235)
    const y = Phaser.Math.Clamp(pointer.worldY, SHOE_Y - 125, SHOE_Y + 125)
    const cloud = this.add.image(x, y, 'bubbles').setDisplaySize(150, 150).setAlpha(0.35).setDepth(3)
    this.lastFoamPoint = { x, y }
    this.foamCoverage = Math.min(100, this.foamCoverage + FOAM_STEP)
    this.foamClouds.push(cloud)
    this.cleanedAmount = Math.min(25, this.foamCoverage / SPONGE_TARGET * 25)
    this.updateProgress()
    if (this.foamCoverage >= SPONGE_TARGET) this.finishStage()
  }

  updateProgress() {
    this.progressFull.setCrop(0, 0, 924 * this.cleanedAmount / 100, 88)
    this.progressLabel.setText(`${STAGES[this.stageIndex].label} • ${Math.floor(this.cleanedAmount)}%`)
  }

  finishStage() {
    if (this.completedStages.has(this.stageIndex)) return
    const finishedIndex = this.stageIndex
    const stage = STAGES[finishedIndex]
    this.completedStages.add(finishedIndex)
    this.cleanedAmount = stage.end
    this.stageTicks[finishedIndex].setVisible(true)
    this.awardCoins(stage)
    this.releaseCleaning()
    if (finishedIndex === STAGES.length - 1) {
      this.dirtCanvas.getContext().clearRect(0, 0, 1024, 1024)
      this.dirtCanvas.refresh()
      this.updateProgress()
      this.time.delayedCall(350, () => this.completeRound())
      return
    }
    this.stageIndex += 1
    this.tool = null
    this.awaitingTool = true
    this.cursor.setVisible(false)
    const nextStage = STAGES[this.stageIndex]
    this.toolLabel.setText(`Tap ${nextStage.label} to continue`)
    this.updateToolVisuals()
    this.updateProgress()
  }

  awardCoins(stage) {
    const { reward: amount, label } = stage
    this.roundCoins += amount
    this.totalCoins += amount
    this.coinText.setText(String(this.totalCoins))
    this.showStageReward(label, amount)
  }

  showStageReward(label, amount) {
    const overlay = this.add.container(WIDTH / 2, 470).setDepth(30).setScale(0.65).setAlpha(0)
    const panel = this.add.graphics()
    panel.fillStyle(0x163f5d, 0.95)
    panel.fillRoundedRect(-205, -102, 410, 204, 28)
    panel.lineStyle(6, 0xffe66b, 1)
    panel.strokeRoundedRect(-205, -102, 410, 204, 28)
    const title = this.add.text(0, -48, 'TASK COMPLETE!', { fontFamily: 'Mochiy Pop One', fontSize: '27px', color: '#fff' }).setOrigin(0.5)
    const detail = this.add.text(0, -8, `${label} MASTERED`, { fontFamily: 'Mochiy Pop One', fontSize: '15px', color: '#9de8ff' }).setOrigin(0.5)
    const coin = this.add.image(-48, 52, 'coin').setDisplaySize(48, 48)
    const reward = this.add.text(0, 53, `+${amount} COINS`, { fontFamily: 'Mochiy Pop One', fontSize: '24px', color: '#ffe66b', stroke: '#70400b', strokeThickness: 4 }).setOrigin(0, 0.5)
    overlay.add([panel, title, detail, coin, reward])
    this.tweens.add({ targets: overlay, scaleX: 1, scaleY: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' })
    this.tweens.add({
      targets: coin,
      x: 46 - WIDTH / 2,
      y: 66 - 470,
      scaleX: 0.55,
      scaleY: 0.55,
      duration: 950,
      delay: 950,
      ease: 'Cubic.easeIn',
    })
    this.tweens.add({
      targets: [this.coinIcon, this.coinText],
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 180,
      delay: 1800,
      yoyo: true,
    })
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 260,
      delay: 2100,
      onComplete: () => overlay.destroy(),
    })
  }

  playClothSwipe() {
    if (this.time.now - this.lastClothSfxAt < 85) return
    this.lastClothSfxAt = this.time.now
    if (this.soundEnabled) this.sound.play('clothSfx', { volume: 1 })
  }

  eraseLayer(texture, x, y, radius, previous) {
    const context = texture.getContext()
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.lineCap = 'round'
    context.lineWidth = radius * 2
    context.beginPath()
    if (previous) { context.moveTo(previous.x, previous.y); context.lineTo(x, y); context.stroke() } else { context.arc(x, y, radius, 0, Math.PI * 2); context.fill() }
    context.restore()
    texture.refresh()
  }

  countOpaquePixels(texture) {
    const pixels = texture.getContext().getImageData(0, 0, 1024, 1024).data
    let count = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count += 1
    return count
  }

  completeRound() {
    if (this.state !== 'gameplay') return
    this.state = 'result'
    this.releaseCleaning()
    this.dirtyShoe.setVisible(false)
    this.audio.stopMusic()
    this.audio.sound('success', { volume: 0.65 }).play()
    this.showResult()
  }

  showResult() {
    this.resultOverlay = this.add.container(0, 0).setDepth(10)
    this.resultOverlay.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.48).setInteractive())
    this.resultOverlay.add(this.add.image(WIDTH / 2, HEIGHT / 2, 'resultBg').setDisplaySize(520, 645))
    this.resultOverlay.add(this.add.image(WIDTH / 2, 300, 'resultLogo').setDisplaySize(120, 120))
    this.resultOverlay.add(this.add.text(WIDTH / 2, 470, 'TIME\n' + this.formatTime(this.elapsed) + '\n\nROUND REWARD\n' + this.roundCoins + ' COINS', { fontFamily: 'Mochiy Pop One', fontSize: '19px', color: '#111', align: 'center' }).setOrigin(0.5))
    this.addCompletionConfetti()
    const next = this.add.image(WIDTH / 2, 640, 'resultNext').setDisplaySize(240, 74).setInteractive()
    next.on('pointerdown', () => { this.audio.playClick(); this.startRound((this.roundIndex + 1) % shoes.length) })
    const restart = this.add.image(WIDTH / 2, 730, 'resultRestart').setDisplaySize(240, 74).setInteractive()
    restart.on('pointerdown', () => { this.audio.playClick(); this.startRound(this.roundIndex) })
    this.resultOverlay.add([next, restart])
    this.addPressFeedback(next)
    this.addPressFeedback(restart)
  }

  addCompletionConfetti() {
    const colors = [0xff4f9a, 0xffd84d, 0x5ccaf4, 0x8fd14f, 0xffb83e, 0x9c73e8]
    for (let index = 0; index < 38; index += 1) {
      const startX = Phaser.Math.Between(70, WIDTH - 70)
      const startY = Phaser.Math.Between(205, 330)
      const piece = this.add.rectangle(startX, startY, Phaser.Math.Between(8, 13), Phaser.Math.Between(15, 23), Phaser.Utils.Array.GetRandom(colors))
        .setRotation(Phaser.Math.FloatBetween(-0.65, 0.65))
      this.resultOverlay.add(piece)
      this.tweens.add({
        targets: piece,
        x: Phaser.Math.Clamp(startX + Phaser.Math.Between(-130, 130), 36, WIDTH - 36),
        y: Phaser.Math.Between(650, 880),
        angle: Phaser.Math.Between(-450, 450),
        alpha: 0,
        duration: Phaser.Math.Between(1050, 1700),
        delay: Phaser.Math.Between(0, 260),
        ease: 'Quad.easeIn',
      })
    }
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000)
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  }

  openPause() {
    if (this.state !== 'gameplay') return
    this.state = 'pause'
    this.pauseStartedAt = this.time.now
    this.releaseCleaning()
    this.audio.stopMusic()
    this.audio.playMusic('menu')
    this.showPauseModal()
  }

  showPauseModal() {
    this.pauseOverlay = this.add.container(0, 0).setDepth(10)
    this.pauseOverlay.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.15).setInteractive())
    this.pauseOverlay.add(this.add.image(WIDTH / 2, HEIGHT / 2, 'pauseBg').setDisplaySize(520, 645))
    this.pauseOverlay.add(this.add.image(WIDTH / 2, 305, 'pauseLogo').setDisplaySize(120, 120))
    const restart = this.add.image(WIDTH / 2, 620, 'pauseRestart').setDisplaySize(250, 77).setInteractive()
    restart.on('pointerdown', () => { this.audio.playClick(); this.startRound(this.roundIndex) })
    const quit = this.add.image(WIDTH / 2, 725, 'pauseQuit').setDisplaySize(250, 77).setInteractive()
    quit.on('pointerdown', () => { this.audio.playClick(); this.showQuitConfirm() })
    const toggle = this.add.text(WIDTH / 2, 420, `SOUND  ${this.soundEnabled ? 'ON' : 'OFF'}`, { fontFamily: 'Mochiy Pop One', fontSize: '16px', color: '#111', backgroundColor: '#fff', padding: { x: 22, y: 10 } }).setOrigin(0.5).setInteractive()
    toggle.on('pointerdown', () => { this.audio.playClick(); this.soundEnabled = !this.soundEnabled; this.audio.setEnabled(this.soundEnabled); toggle.setText(`SOUND  ${this.soundEnabled ? 'ON' : 'OFF'}`) })
    const close = this.add.image(465, 225, 'pauseClose').setDisplaySize(34, 34).setInteractive()
    close.on('pointerdown', () => this.resumeGame())
    this.pauseOverlay.add([restart, quit, toggle, close])
    this.addPressFeedback(restart)
    this.addPressFeedback(quit)
    this.addPressFeedback(toggle)
    this.addPressFeedback(close)
  }

  resumeGame() {
    this.audio.playClick()
    this.pausedAt += this.time.now - this.pauseStartedAt
    this.pauseStartedAt = 0
    this.pauseOverlay?.destroy()
    this.pauseOverlay = null
    this.state = 'gameplay'
    this.audio.playMusic('gameplay')
  }

  showQuitConfirm() {
    this.pauseOverlay?.setVisible(false)
    this.quitOverlay = this.add.container(0, 0).setDepth(11)
    this.quitOverlay.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.15).setInteractive())
    const popup = { x: WIDTH / 2, y: HEIGHT / 2, width: 500, height: 350, padding: 40 }
    this.quitOverlay.add(this.add.image(popup.x, popup.y, 'quitBg').setDisplaySize(popup.width, popup.height))

    // Keep every control inside a consistent inset so the popup has breathing room.
    this.quitOverlay.add(this.add.text(popup.x, 446, 'Quit game?', {
      fontFamily: 'Mochiy Pop One', fontSize: '25px', color: '#111', align: 'center',
    }).setOrigin(0.5))
    this.quitOverlay.add(this.add.text(popup.x, 495, 'Your current round will be lost.', {
      fontFamily: 'Mochiy Pop One', fontSize: '15px', color: '#333', align: 'center',
    }).setOrigin(0.5))

    const closeQuit = () => {
      this.audio.playClick()
      this.quitOverlay?.destroy()
      this.quitOverlay = null
      this.pauseOverlay?.setVisible(true)
    }
    const close = this.add.image(popup.x + popup.width / 2 - popup.padding / 2, popup.y - popup.height / 2 + popup.padding / 2, 'quitClose')
      .setDisplaySize(38, 38).setInteractive()
    close.on('pointerdown', closeQuit)

    const cancel = this.add.image(174, 585, 'quitCancel').setDisplaySize(190, 76).setInteractive()
    cancel.on('pointerdown', closeQuit)
    const quit = this.add.image(402, 585, 'quitConfirm').setDisplaySize(190, 76).setInteractive()
    quit.on('pointerdown', () => {
      this.audio.playClick()
      this.quitOverlay?.destroy()
      this.pauseOverlay?.destroy()
      this.showStart()
    })
    this.quitOverlay.add([close, cancel, quit])
    this.addPressFeedback(close)
    this.addPressFeedback(cancel)
    this.addPressFeedback(quit)
  }

  resize() {
    const scale = Math.min(this.scale.width / WIDTH, this.scale.height / HEIGHT)
    this.cameras.main.setZoom(scale)
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2)
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000',
  scale: { mode: Phaser.Scale.FIT, width: WIDTH, height: HEIGHT },
  scene: [LoadingScene, GameScene],
})
