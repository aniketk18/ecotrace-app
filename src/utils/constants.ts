export const CAT_META = {
  energy: {
    label: 'ENERGY',
    icon: '⚡',
    color: '#B5541A',
    barColor: '#F4A261',
    cls: 'cat-energy',
  },
  transport: {
    label: 'TRANSPORT',
    icon: '🚗',
    color: '#2A5C7A',
    barColor: '#457B9D',
    cls: 'cat-transport',
  },
  food: {
    label: 'FOOD & DIET',
    icon: '🍽',
    color: '#1B6B45',
    barColor: '#52B788',
    cls: 'cat-food',
  },
  waste: {
    label: 'WASTE & LIFESTYLE',
    icon: '♻️',
    color: '#9B1A1A',
    barColor: '#E76F51',
    cls: 'cat-waste',
  },
  custom: {
    label: 'CUSTOM',
    icon: '✨',
    color: '#6B34B5',
    barColor: '#9B5DE5',
    cls: 'cat-custom',
  },
};

export const MAX_WASTE_SCORE = 30 + 20 + 10 + 30 + 35 + 25 + 25 + 20 + 20 + 20 + 20 + 15 + 15 + 20 + 20; // 345

export function earthIconsHTML(earths: number): string {
  const full = Math.floor(earths);
  const frac = earths - full;
  const capped = Math.min(full, 6);
  let html = '🌍'.repeat(capped);
  if (frac >= 0.5 && capped < 6) html += '🌗';
  if (!html) html = '🌱';
  return html;
}

export function getClassification(earths: number) {
  if (earths <= 1) {
    return { level: 'LOW', color: '#52B788', badge: 'badge-low', emoji: '🌱' };
  } else if (earths <= 2) {
    return { level: 'MEDIUM', color: '#F4A261', badge: 'badge-medium', emoji: '⚠️' };
  } else {
    return { level: 'HIGH', color: '#E76F51', badge: 'badge-high', emoji: '🔴' };
  }
}

export function overShootDate(earths: number): string {
  const baseDate = new Date();
  const daysUntilOvershoot = Math.round((365 / earths) * 0.5);
  const overshootDate = new Date(baseDate.getTime() + daysUntilOvershoot * 24 * 60 * 60 * 1000);
  return overshootDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
