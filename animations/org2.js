const bodyEl = document.body

function getBoundaries() {
  const els = Array.from(document.querySelectorAll(`
    body,
    .meeting--entities
  `))
}

function randomPoint(rect, padding = 0) {
  const x = Math.random() * (rect.width - rect.x) - padding
      , y = Math.random() * (rect.height - rect.y) - padding

  return { x, y }
}

function setup() {
  const canvasEl = document.createElement('canvas')
      , rect = bodyEl.getBoundingClientRect()

  canvasEl.setAttribute('height', rect.height)
  canvasEl.setAttribute('width', rect.width)

  Object.assign(canvasEl.style, {
    position: 'absolute',
    left: 0,
    top: 0,
  })

  bodyEl.insertBefore(canvasEl, bodyEl.firstChild)

  return [ rect, canvasEl ]
}

function radians(degrees) {
  return degrees * Math.PI / 180
}

function randomBetween(start, end) {
  const diff = end - start

  return start + Math.floor(Math.random() * diff)
}

function nextPos(
  rect,
  prevPos,
  angle,
  d
) {
  const { x, y } = prevPos

  const nextX = x + (d * Math.sin(radians(angle)))
      , nextY = y + (d * Math.cos(radians(angle)))

  return { x: Math.floor(nextX), y: Math.floor(nextY) }
}

function drawLetter(ctx, rect, text) {
  const point = randomPoint(rect)
  ctx.fillText(text, point.x, point.y)
}

class Letter {
  constructor(letter, rect, d) {
    this.letter = letter
    this.rect = rect;
    this.d = d;

    this.init()
  }

  init() {
    this.pos = randomPoint(this.rect, 30)
    this.angle = randomBetween(0, 360)
    this.refreshDelta()
  }

  refreshDelta() {
    this.dx = Math.floor(this.d * Math.sin(radians(this.angle)))
    this.dy = Math.floor(this.d * Math.cos(radians(this.angle)))

  }

  tick() {
    const pos = {
      x: this.pos.x + this.dx,
      y: this.pos.y + this.dy,
    }

    // Right limit
    if (pos.x >= this.rect.width) {
      this.angle = randomBetween(180, 360)
      this.refreshDelta()
    }

    // Left limit
    if (pos.x <= 0) {
      this.angle = randomBetween(0, 180)
      this.refreshDelta()
    }

    // Top limit
    if (pos.y >= this.rect.height) {
      this.angle = randomBetween(90, 270)
      this.refreshDelta()
    }

    // Bottom limit
    if (pos.y <= 0) {
      this.angle = randomBetween(-90, 90)
      this.refreshDelta()
    }

    this.pos = pos
  }
}

function main(letter) {
  const [ rect, canvasEl ] = setup()
      , ctx = canvasEl.getContext('2d')

  ctx.font = '24px sans-serif'
  ctx.fillStyle = '#333'

  let pos = randomPoint(rect, 30)
    , angle = randomBetween(0, 360)

  const d = 3

  const numLetters = 250
      , letters = []

  for (let i = 0; i < numLetters; i++) {
    const letter = ['O', 'R', 'G'][i % 3]
    letters.push(new Letter(letter, rect, d))
  }

  // let i = 0

  function step() {
    ctx.clearRect(0, 0, rect.width, rect.height)

    letters.forEach(letter => {
      letter.tick()
      ctx.fillText(letter.letter, letter.pos.x, letter.pos.y)
    })

    requestAnimationFrame(step)

    // i += 1
  }

  step()
}

main()
