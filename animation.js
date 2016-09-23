"use strict";

var el = document.createElement('div')

el.style.overflow = 'hidden';
el.style.position = 'absolute';
el.style.top = 0;
el.style.bottom = 0;
el.style.left = 0;
el.style.right = 0;

document.body.insertBefore(el, document.body.children[0]);

function makeOrg(lighten) {
  ['O', 'R', 'G'].forEach(function (letter, i) {
    var letterEl = document.createElement('span')

    letterEl.textContent = letter;

    letterEl.style.position = 'absolute';
    letterEl.style.top = '50%';
    letterEl.style.left = '50%';

    letterEl.style.fontSize = '24px'
    letterEl.style.color = '#76aed0'

    if (lighten) {
      letterEl.style.opacity = '.1';
    }

    letterEl.animate([
      { transform: 'rotate(' + (360 * (i / 3)) + 'deg)' },
      { transform: 'rotate(' + (360 * ((i + 1) / 3)) + 'deg)' },
      { transform: 'rotate(' + (360 * ((i + 2) / 3)) + 'deg)' },
      { transform: 'rotate(' + (360 * ((i + 3) / 3)) + 'deg)' },
    ], {
      duration: 5000,
      iterations: Infinity,
      easing: 'ease-in-out'
    })

    letterEl.animate([
      { transformOrigin: '0vh' },
      { transformOrigin: '-50vh' },
      { transformOrigin: '0vh' },
      { transformOrigin: '50vh' },
      { transformOrigin: '0vh' }
    ], {
      duration: 10000,
      iterations: Infinity
    })

    el.appendChild(letterEl);
  });
}

var NUMBER_OF_ORGS = 18
  , SPACING_DELAY = 10

for (var i = 0; i < NUMBER_OF_ORGS; i++) {
  var lighten = i > 0 && i < NUMBER_OF_ORGS - 1

  setTimeout(makeOrg.bind(null, lighten), SPACING_DELAY * i);
}
