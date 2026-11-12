import { randomColor } from '../lib/colors.js';
import { h, vaseIcon } from '../lib/dom.js';
import { sampleStories } from '../lib/samples.js';

let currentIndex = 0;

export function mountHome(root) {
  const title = h('span', { class: 'story-card__title' });
  const count = h('span', { class: 'story-card__count' });
  const summary = h('span', { class: 'story-card__summary' });
  const link = h(
    'a',
    { class: 'story-card__link' },
    h('span', { class: 'story-card__heading' }, title, count),
    summary,
  );

  const screen = h(
    'section',
    { class: 'screen' },
    h('div', { class: 'map-slot' }, h('p', { class: 'note' }, 'Acá va el mapa en la etapa 2')),
    h('p', { class: 'brand home-brand' }, 'Vetas'),
    h(
      'a',
      { class: 'vase-button', href: '#/contar', 'aria-label': 'Contar tu historia' },
      vaseIcon(),
    ),
    h(
      'article',
      { class: 'story-card' },
      link,
      h(
        'div',
        { class: 'story-card__arrows' },
        h(
          'button',
          {
            class: 'icon-button',
            type: 'button',
            'aria-label': 'Historia anterior',
            onClick: () => move(-1),
          },
          '←',
        ),
        h(
          'button',
          {
            class: 'icon-button',
            type: 'button',
            'aria-label': 'Historia siguiente',
            onClick: () => move(1),
          },
          '→',
        ),
      ),
    ),
  );

  function show() {
    const story = sampleStories[currentIndex];
    title.textContent = story.title;
    count.textContent = `${story.outings} salidas`;
    summary.textContent = story.summary;
    link.href = `#/historia/${encodeURIComponent(story.id)}`;
    screen.style.setProperty('--story-color', story.color);
  }

  function move(step) {
    const previous = sampleStories[currentIndex].color;
    currentIndex = (currentIndex + step + sampleStories.length) % sampleStories.length;
    sampleStories[currentIndex].color = randomColor(previous);
    show();
  }

  show();
  root.append(screen);
}
