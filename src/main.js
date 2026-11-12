import './styles/tokens.css';
import './styles/app.css';
import { mountCompose } from './screens/compose.js';
import { mountHome } from './screens/home.js';
import { mountStory } from './screens/story.js';
import { mountWelcome } from './screens/welcome.js';

const app = document.querySelector('#app');
let cleanup = null;

const routes = [
  { pattern: /^#\/mapa$/, mount: mountHome },
  { pattern: /^#\/historia\/([^/]+)$/, mount: mountStory, params: ['id'] },
  { pattern: /^#\/contar$/, mount: mountCompose },
];

function resolve(hash) {
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      const params = Object.fromEntries(
        (route.params ?? []).map((name, index) => [name, decodeURIComponent(match[index + 1])]),
      );
      return { mount: route.mount, params };
    }
  }
  return { mount: mountWelcome, params: {} };
}

function navigate() {
  cleanup?.();
  app.replaceChildren();
  const { mount, params } = resolve(location.hash);
  cleanup = mount(app, params) ?? null;
}

window.addEventListener('hashchange', navigate);
navigate();
