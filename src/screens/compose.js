import { h } from '../lib/dom.js';

export function mountCompose(root) {
  root.append(
    h(
      'section',
      { class: 'screen' },
      h('div', { class: 'map-slot' }, h('p', { class: 'note' }, 'Acá va el mapa en la etapa 2')),
      h(
        'div',
        { class: 'sheet sheet--compose' },
        h(
          'div',
          { class: 'sheet__top' },
          h('span', {}, 'Contá tu historia'),
          h('a', { class: 'icon-button', href: '#/mapa', 'aria-label': 'Cancelar' }, '×'),
        ),
        h('h1', { class: 'sheet__title' }, 'Salida 1'),
        h('p', { class: 'note' }, 'El formulario llega en la etapa 5'),
      ),
    ),
  );
}
