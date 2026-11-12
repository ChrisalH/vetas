export const PALETTE = [
  { base: '#4f2026', line: '#b5525c' },
  { base: '#23382f', line: '#64977e' },
  { base: '#24324a', line: '#6a8abd' },
  { base: '#3d2640', line: '#9c6ea5' },
];

export function randomColor(except = null) {
  const options = PALETTE.filter(({ base }) => base !== except);
  return options[Math.floor(Math.random() * options.length)].base;
}

export function lineColor(base) {
  return PALETTE.find((color) => color.base === base)?.line ?? PALETTE[0].line;
}
