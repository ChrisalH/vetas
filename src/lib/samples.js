import { randomColor } from './colors.js';

const stories = [
  {
    id: 'verano-martes',
    title: 'El verano de los martes',
    summary: 'Un mes de bares chicos y ninguna definición.',
    outings: 4,
  },
  {
    id: 'casi-novios',
    title: 'Casi novios en Almagro',
    summary: 'Caminatas largas y una despedida en el 60.',
    outings: 4,
  },
  {
    id: 'tres-cafes',
    title: 'Tres cafés y chau',
    summary: 'Duró poco y todavía me acuerdo de cómo se reía.',
    outings: 3,
  },
];

export const sampleStories = stories.map((story) => ({ ...story, color: randomColor() }));

export function findStory(id) {
  return sampleStories.find((story) => story.id === id) ?? null;
}
