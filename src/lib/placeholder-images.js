import data from './placeholder-images.json';

export const placeholderImages = data.placeholderImages;

export function getPlaceholderImage(id) {
  return placeholderImages.find((p) => p.id === id);
}
