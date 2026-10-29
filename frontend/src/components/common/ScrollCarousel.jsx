import React, { useRef, useState, useEffect, useCallback } from 'react';
import './ScrollCarousel.css';

/**
 * ScrollCarousel – reusable horizontal snap carousel.
 *
 * Props:
 *   children       – items to render inside the track
 *   sectionHeader  – optional node rendered in the header (title + "See all" link)
 *   className      – extra class on the wrapper
 *   trackClassName – extra class on the track element
 *   gap            – CSS gap value (default: 'var(--space-4)')
 *   ariaLabel      – accessible label for the carousel region
 */
const ScrollCarousel = ({
  children,
  sectionHeader,
  className = '',
  trackClassName = '',
  gap,
  ariaLabel = 'Scrollable content',
}) => {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Compute scroll state
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const tolerance = 4; // px rounding
    setAtStart(el.scrollLeft <= tolerance);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });

    // ResizeObserver keeps disabled state accurate on resize
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollBy = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by one "page" = visible width minus one card peek
    const page = el.clientWidth - 80;
    el.scrollBy({ left: dir * page, behavior: 'smooth' });
  }, []);

  // Keyboard navigation on the track
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      trackRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      const el = trackRef.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
  }, [scrollBy]);

  const prevBtn = (
    <button
      className="scroll-carousel-btn scroll-carousel-btn--prev"
      onClick={() => scrollBy(-1)}
      aria-label="Previous"
      aria-disabled={atStart}
      tabIndex={atStart ? -1 : 0}
      type="button"
    >
      &#8249;
    </button>
  );

  const nextBtn = (
    <button
      className="scroll-carousel-btn scroll-carousel-btn--next"
      onClick={() => scrollBy(1)}
      aria-label="Next"
      aria-disabled={atEnd}
      tabIndex={atEnd ? -1 : 0}
      type="button"
    >
      &#8250;
    </button>
  );

  return (
    <div className={`scroll-carousel-wrapper ${className}`}>
      {/* Section header: title on left, mobile arrows + optional See all on right */}
      {sectionHeader && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="flex-grow-1">{sectionHeader}</div>
          {/* Mobile arrow buttons live in the header */}
          <div className="d-flex align-items-center gap-2 d-md-none">
            {prevBtn}
            {nextBtn}
          </div>
        </div>
      )}

      {/* Track with desktop arrow buttons on edges */}
      <div
        className="position-relative"
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        {/* Desktop prev arrow */}
        <div className="d-none d-md-block">{prevBtn}</div>

        {/* Fade gradients */}
        <div className={`scroll-carousel-fade-left${atStart ? ' hidden' : ''}`} aria-hidden="true" />
        <div className={`scroll-carousel-fade-right${atEnd ? ' hidden' : ''}`} aria-hidden="true" />

        {/* The scrollable track */}
        <div
          ref={trackRef}
          className={`scroll-carousel-track ${trackClassName}`}
          style={gap ? { gap } : undefined}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
        >
          {children}
        </div>

        {/* Desktop next arrow */}
        <div className="d-none d-md-block">{nextBtn}</div>
      </div>
    </div>
  );
};

export default ScrollCarousel;

