'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SECTION_SELECTORS = [
  'main.page-content section',
  'main.page-content .section',
  'main.page-content .section-sm',
  'main.page-content .scroll-reveal',
];

export default function ScrollRevealManager() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector('main.page-content');
    if (!root) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targets = Array.from(root.querySelectorAll(SECTION_SELECTORS.join(', ')));
    if (targets.length === 0) {
      targets = Array.from(root.children);
    }

    if (prefersReducedMotion) {
      targets.forEach((target) => {
        target.classList.add('scroll-reveal', 'scroll-reveal-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    targets.forEach((target) => {
      target.classList.add('scroll-reveal');
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
