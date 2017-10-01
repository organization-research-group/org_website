"use strict";

const DURATION = 320
    , UNIT = 18


const c = document.createElement('div')

Object.assign(c.style, {
  position: 'absolute',
  overflow: 'hidden',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
})

document.body.appendChild(c);

function trueOrFalse() {
  return Math.random() > .5
}

function asPixels(props) {
  return Object.assign({}, ...Object.keys(props).map(k => ({
    [k]: props[k] + 'px'
  })))
}


function nextPos(prev, direction, multiplier) {
  const side = 'left' in prev ? 'left' : 'right'

  multiplier = multiplier || (trueOrFalse() ? 1 : -1) * (Math.floor(Math.random() * 3) || 1)
  direction = direction || trueOrFalse() ? side : 'top'


  const nextValue = Math.abs(parseInt(prev[direction]) + (UNIT * multiplier))

  return Object.assign({}, prev, { [direction]: nextValue })
}


function* getState(length, side) {
  const iterations = Math.random() * 24

  const positions = [{
    top: Math.random() * window.innerHeight / 2,
    [side]: Math.random() * window.innerWidth / 2,
  }]

  while (positions.length < length) {
    positions.push(nextPos(positions[positions.length - 1]))
  }

  yield positions;

  for (let i = 1; i < iterations; i++) {
    positions.shift();
    positions.push(nextPos(positions[positions.length - 1]));
    yield positions;
  }

  return positions;
}


function start() {
  const container = document.createElement('div')
      , side = trueOrFalse() ? 'left': 'right'
      , state = getState(4, side)

  let lastPositions

  Object.assign(container.style, {
    position: 'fixed',
    [side]: '0px', top: '0px',
    display: 'none',
  });

  c.appendChild(container);

  let letters = ['O', 'R', 'G'].map(letter => {
    const el = document.createElement('span');

    Object.assign(el.style, {
      position: 'absolute',
      fontWeight: 'bold',
      color: '#76aed0',
      fontSize: '20px',
    })

    el.textContent = letter;
    container.appendChild(el);

    return el;
  })

  if (side === 'right') {
    letters = letters.reverse()
  }

  const interval = setInterval(() => {
    const { value, done } = state.next()
        , positions = value

    container.style.display = 'block';

    if (!done) {

      letters.forEach((el, i) => {
        el.animate([
          asPixels(positions[i]),
          asPixels(positions[i + 1])
        ], DURATION)
      })

      lastPositions = positions;
    } else {
      const finalPositions = letters.reduce(
        acc => acc.concat([nextPos(acc[acc.length - 1], side, 1)]),
        lastPositions.slice(-1)
      )

      letters.forEach((el, i) => {
        el.animate([
          asPixels(lastPositions[i + 1]),
          asPixels(finalPositions[i + 1])
        ], DURATION)
      })

      setTimeout(() => {
        letters.forEach((el, i) => {
          Object.assign(el.style, asPixels(finalPositions[i + 1]))
        })

        clearInterval(interval);
      }, DURATION - 3)
    }
  }, DURATION)
}

start();

setInterval(start, DURATION * 1.5);
