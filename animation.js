"use strict";

const DURATION = 200
    , UNIT = 24


function trueOrFalse() {
  return Math.random() > .5
}

function px({ right, top }) {
  return { right: right + 'px', top: top + 'px' }
}


function nextPos(prev) {
  const direction = trueOrFalse() ? 'right' : 'top'
      , multiplier = trueOrFalse() ? 1 : -1

  const nextValue = Math.abs(prev[direction] + (UNIT * multiplier))

  return Object.assign({}, prev, { [direction]: nextValue })
}


function* getState(length) {
  const positions = [{ top: 0, right: 0 }]

  while (positions.length < length) {
    positions.push(nextPos(positions[positions.length - 1]))
  }

  yield positions;

  while (true) {
    positions.shift();
    positions.push(nextPos(positions[positions.length - 1]));
    yield positions;
  }
}


function start() {
  const container = document.createElement('div')
      , state = getState(4)

  container.style.position = 'absolute';
  container.style.right = 0;
  container.style.top = 0;

  document.body.appendChild(container);

  const letters = ['O', 'R', 'G'].map(letter => {
    const el = document.createElement('span');

    el.style.position = 'absolute';
    el.style.right = '-999px';
    el.style.top = '-999px';
    el.style.fontWeight = 'bold';
    el.style.color = '#76aed0';
    el.style.fontSize = '20px';

    el.textContent = letter;
    container.appendChild(el);

    return el;
  }).reverse()

  setInterval(() => {
    const positions = state.next().value.map(px)

    letters.forEach((el, i) => {
      el.animate([positions[i], positions[i + 1]], DURATION)
    })
  }, DURATION)
}

start();

setInterval(start, 666);
