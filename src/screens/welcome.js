import { h } from '../lib/dom.js';

export function mountWelcome(root) {
  root.append(
    h(
      'section',
      { class: 'screen welcome' },
      h('h1', { class: 'brand' }, 'Vetas'),
      h(
        'p',
        {},
        'Este es un lugar para reivindicar las mini historias de amor, ver qué camino generan en la ciudad de Buenos Aires y, de la misma manera, ver qué camino queda en nosotros.',
      ),
      h(
        'p',
        {},
        '¿Significa que son una historia hermosa? No. ¿Sin dolor? No. Pero es una historia, en fin.',
      ),
      h(
        'p',
        {},
        'Como un jarrón, vamos llevando nuestros caminos encima. Apretá el jarroncito y contá tu historia.',
      ),
      h('a', { class: 'button', href: '#/mapa' }, 'Entrar'),
    ),
  );
}
