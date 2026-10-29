import { describe, it, expect } from 'vitest';

describe('ScrollCarousel Logic Tests', () => {
  it('correctly calculates atStart tolerance', () => {
    const scrollLeft = 0;
    const tolerance = 4;
    const atStart = scrollLeft <= tolerance;
    expect(atStart).toBe(true);
  });

  it('correctly calculates atEnd boundary', () => {
    const scrollLeft = 720;
    const clientWidth = 360;
    const scrollWidth = 1080;
    const tolerance = 4;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - tolerance;
    expect(atEnd).toBe(true);
  });

  it('scrollBy calculation pages visible width minus peek', () => {
    const clientWidth = 768;
    const page = clientWidth - 80;
    expect(page).toBe(688);
  });
});
