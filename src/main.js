import Phaser from 'phaser'
import './style.css'

const WIDTH = 576
const HEIGHT = 1024
const SHOE_SIZE = 500
const SHOE_X = WIDTH / 2
const SHOE_Y = 480
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
    if (this.enabled) this.scene.sound.play('click', { volume: 1 })
  }

  setEnabled(enabled) {
    this.enabled = enabled
    this.scene.sound.setMute(!enabled)
  }

  playMusic(key) {
    if (this.music?.key === key && this.music.isPlaying) return
    this.stopMusic()
    this.music = this.scene.sound.add(key, { loop: true, volume: 0.3 })
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

  create() {
    this.audio = new AudioManager(this)
    this.roundIndex = 0
    this.state = 'start'
    this.soundEnabled = true
    this.showStart()
    this.input.on('pointerup', () => this.releaseCleaning())
    this.scale.on('resize', this.resize, this)
    this.resize(this.scale)
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
    this.add.image(WIDTH / 2, HEIGHT / 2, 'startBg').setDisplaySize(WIDTH, HEIGHT)
    this.add.image(WIDTH / 2, 340, 'startLogo').setDisplaySize(260, 260)
    this.add.image(WIDTH / 2, 815, 'play').setDisplaySize(230, 98).setInteractive()
      .on('pointerdown', () => { this.audio.playClick(); this.startRound(0) })
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
    this.startTime = this.time.now
    this.pausedAt = 0
    this.pauseStartedAt = 0
    this.lastBrushPoint = null
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
    this.progressBg = this.add.image(WIDTH / 2, 142, 'progressEmpty').setDisplaySize(430, 42)
    this.progressFull = this.add.image(73, 142, 'progressFull').setOrigin(0, 0.5).setDisplaySize(430, 42)
    this.progressFull.setCrop(0, 0, 0, 88)
    this.progressLabel = this.add.text(WIDTH / 2, 142, '0% Clean', { fontFamily: 'Mochiy Pop One', fontSize: '15px', color: '#101010' }).setOrigin(0.5)
    this.cleanShoe = this.add.image(SHOE_X, SHOE_Y, `shoe${this.roundIndex}Clean`).setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.dirtCanvas = this.textures.createCanvas(`dirt-${Date.now()}`, 1024, 1024)
    this.dirtCanvas.getContext().drawImage(this.textures.get(`shoe${this.roundIndex}Dirty`).getSourceImage(), 0, 0, 1024, 1024)
    this.dirtCanvas.refresh()
    this.initialDirtPixels = this.countOpaquePixels(this.dirtCanvas)
    this.dirtyShoe = this.add.image(SHOE_X, SHOE_Y, this.dirtCanvas.key).setDisplaySize(SHOE_SIZE, SHOE_SIZE)
    this.foamClouds = []
    this.brushButton = this.add.image(190, 850, 'brush').setScale(0.16)
    this.spongeButton = this.add.image(385, 850, 'sponge').setScale(0.16)
    this.brushButton.setInteractive().on('pointerdown', () => this.selectTool('brush'))
    this.spongeButton.setInteractive().on('pointerdown', () => this.selectTool('sponge'))
    this.tool = 'sponge'
    this.toolLabel = this.add.text(WIDTH / 2, 950, 'Sponge selected', { fontFamily: 'Mochiy Pop One', fontSize: '16px', color: '#fff' }).setOrigin(0.5)
    this.cursor = this.add.image(SHOE_X, SHOE_Y, 'sponge').setScale(0.182).setDepth(6).setVisible(false)
    this.updateToolVisuals()
    this.cleaningSound = this.audio.sound('cleaning', { loop: true, volume: 0.3 })
    this.bubblesSound = this.audio.sound('bubbles', { loop: true, volume: 0.3 })
    this.events.on('update', this.updateGame, this)
    this.input.on('pointerdown', this.beginCleaning, this)
    this.input.on('pointermove', this.moveCleaning, this)
  }

  updateGame(_time, delta) {
    if (this.state !== 'gameplay') return
    this.elapsed = Math.max(0, this.time.now - this.startTime - this.pausedAt)
    if (this.isPointerHeld && this.lastPointer) this.scrub(this.lastPointer)
  }

  selectTool(tool) {
    if (this.state !== 'gameplay') return
    this.audio.playClick()
    this.tool = tool
    this.cursor.setTexture(tool === 'brush' ? 'brush' : 'sponge')
    this.toolLabel.setText(`${tool === 'brush' ? 'Brush' : 'Sponge'} selected`)
    this.updateToolVisuals()
  }

  updateToolVisuals() {
    this.brushButton.setScale(this.tool === 'brush' ? 0.22 : 0.16).setAlpha(this.tool === 'brush' ? 1 : 0.45)
    this.spongeButton.setScale(this.tool === 'sponge' ? 0.22 : 0.16).setAlpha(this.tool === 'sponge' ? 1 : 0.45)
  }

  beginCleaning(pointer) {
    if (this.state !== 'gameplay' || !this.isOnShoe(pointer)) return
    this.isPointerHeld = true
    this.lastPointer = pointer
    const sound = this.tool === 'brush' ? this.cleaningSound : this.bubblesSound
    if (!sound.isPlaying) sound.play()
    this.scrub(pointer)
  }

  moveCleaning(pointer) {
    this.cursor.setPosition(pointer.worldX, pointer.worldY).setVisible(this.state === 'gameplay')
    if (this.isPointerHeld && this.isOnShoe(pointer)) this.lastPointer = pointer
  }

  releaseCleaning() {
    this.isPointerHeld = false
    this.lastBrushPoint = null
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
    this.eraseLayer(this.dirtCanvas, localX, localY, 108, this.lastBrushPoint)
    this.foamClouds = this.foamClouds.filter((cloud) => {
      const hit = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cloud.x, cloud.y) < 72
      if (hit) cloud.destroy()
      return !hit
    })
    this.lastBrushPoint = { x: localX, y: localY }
    const remaining = this.countOpaquePixels(this.dirtCanvas)
    this.cleanedAmount = Math.min(100, (this.initialDirtPixels - remaining) / this.initialDirtPixels * 100)
    this.progressFull.setCrop(0, 0, 924 * this.cleanedAmount / 100, 88)
    this.progressLabel.setText(`${Math.floor(this.cleanedAmount)}% Clean`)
    if (remaining === 0) this.completeRound()
  }

  addFoam(pointer) {
    if (this.foamClouds.length >= 160) return
    const x = Phaser.Math.Clamp(pointer.worldX, SHOE_X - 235, SHOE_X + 235)
    const y = Phaser.Math.Clamp(pointer.worldY, SHOE_Y - 125, SHOE_Y + 125)
    const cloud = this.add.image(x, y, 'bubbles').setDisplaySize(150, 150).setAlpha(0.35).setDepth(3)
    this.foamCoverage = Math.min(100, this.foamCoverage + 1.2)
    this.foamClouds.push(cloud)
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
    this.resultOverlay.add(this.add.text(WIDTH / 2, 470, 'TIME\n' + this.formatTime(this.elapsed) + '\n\nFOAM COVERAGE\n' + Math.floor(this.foamCoverage) + '%', { fontFamily: 'Mochiy Pop One', fontSize: '19px', color: '#111', align: 'center' }).setOrigin(0.5))
    this.addCompletionConfetti()
    const next = this.add.image(WIDTH / 2, 640, 'resultNext').setDisplaySize(240, 74).setInteractive()
    next.on('pointerdown', () => { this.audio.playClick(); this.startRound((this.roundIndex + 1) % shoes.length) })
    const restart = this.add.image(WIDTH / 2, 730, 'resultRestart').setDisplaySize(240, 74).setInteractive()
    restart.on('pointerdown', () => { this.audio.playClick(); this.startRound(this.roundIndex) })
    this.resultOverlay.add([next, restart])
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
