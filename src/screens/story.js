import { h } from '../lib/dom.js';
import { findStory } from '../lib/samples.js';

export function mountStory(root, { id }) {
  const story = findStory(id);

  if (!story) {
    location.hash = '#/mapa';
    return;
  }

  const screen = h(
    'section',
    { class: 'screen' },
    h('div', { class: 'map-slot' }, h('p', { class: 'note' }, 'Acá va el mapa en la etapa 2')),
    h(
      'div',
      { class: 'sheet sheet--story' },
      h(
        'div',
        { class: 'sheet__top' },
        h('span', {}, story.title),
        h('a', { class: 'icon-button', href: '#/mapa', 'aria-label': 'Cerrar historia' }, '×'),
      ),
      h('h1', { class: 'sheet__title' }, 'Salida 1'),
      h('p', { class: 'note' }, 'Las salidas llegan en la etapa 4'),
    ),
  );

  screen.style.setProperty('--story-color', story.color);
  root.append(screen);
}
