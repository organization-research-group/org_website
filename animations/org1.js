const bodyEl = document.body

function getBoundaries() {
  const els = Array.from(document.querySelectorAll(`
    body,
    .meeting--entities
  `))
}

function randomPoint(rect) {
  const x = Math.random() * (rect.width - rect.x)
      , y = Math.random() * (rect.height - rect.y)

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

function drawLetter(ctx, rect, text) {
  const point = randomPoint(rect)
  ctx.fillText(text, point.x, point.y)
}

function main() {
  const [ rect, canvasEl ] = setup()
      , ctx = canvasEl.getContext('2d')

  ctx.font = '24px sans-serif'

  const letters = ['O', 'R', 'G']

  let i = 0

  setInterval(() => {
    drawLetter(ctx, rect, letters[i % 3])
    i += 1
  }, 10)
}

main()
