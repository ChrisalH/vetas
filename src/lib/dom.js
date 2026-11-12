export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (name.startsWith('on') && typeof value === 'function') {
      element.addEventListener(name.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(name, value);
    }
  }

  element.append(...children.flat());
  return element;
}

export function vaseIcon() {
  const template = document.createElement('template');
  template.innerHTML = `
    <svg width="28" height="38" viewBox="0 0 24 33" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="3" rx="5.3" ry="1.1"></ellipse>
      <path d="M6.7 3.3C7.4 5.4 8.7 7.2 8.7 9C8.7 12 7.6 13.2 6.1 14.2C4.2 15.2 3 17.2 3 19.8C3 23.4 5 26.6 7.8 28.6C10 29.6 14 29.6 16.2 28.6C19 26.6 21 23.4 21 19.8C21 17.2 19.8 15.2 17.9 14.2C16.4 13.2 15.3 12 15.3 9C15.3 7.2 16.6 5.4 17.3 3.3"></path>
      <path d="M7.8 28.6V30.4C10 32 14 32 16.2 30.4V28.6"></path>
    </svg>`;
  return template.content.firstElementChild;
}
