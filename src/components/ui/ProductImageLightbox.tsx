'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './ProductImageLightbox.module.css';

type ProductImageLightboxProps = {
  isOpen: boolean;
  images: string[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
  productName: string;
};

function normalizeIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  if (index < 0) {
    return length - 1;
  }

  if (index >= length) {
    return 0;
  }

  return index;
}

export default function ProductImageLightbox({
  isOpen,
  images,
  activeIndex,
  onChangeIndex,
  onClose,
  productName,
}: ProductImageLightboxProps) {
  useEffect(() => {
    if (!isOpen || images.length === 0) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (images.length < 2) {
        return;
      }

      if (event.key === 'ArrowRight') {
        onChangeIndex(normalizeIndex(activeIndex + 1, images.length));
      }

      if (event.key === 'ArrowLeft') {
        onChangeIndex(normalizeIndex(activeIndex - 1, images.length));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, images.length, isOpen, onChangeIndex, onClose]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  const safeIndex = normalizeIndex(activeIndex, images.length);
  const currentImage = images[safeIndex];
  const hasMultipleImages = images.length > 1;

  // Render through a portal: transformed ancestors (e.g. .scroll-reveal) turn
  // position:fixed into a page-relative box and push the dialog off-screen.
  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${productName} image preview`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.title}>{productName}</p>
          <div className={styles.headerActions}>
            <span className={styles.counter}>
              {safeIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Close image preview"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className={styles.imageViewport}>
          <img
            src={currentImage}
            alt={`${productName} image ${safeIndex + 1}`}
            className={styles.image}
          />

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navLeft}`}
                onClick={() => onChangeIndex(normalizeIndex(safeIndex - 1, images.length))}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navRight}`}
                onClick={() => onChangeIndex(normalizeIndex(safeIndex + 1, images.length))}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className={styles.thumbRail}>
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`${styles.thumbButton} ${index === safeIndex ? styles.thumbButtonActive : ''}`}
                onClick={() => onChangeIndex(index)}
                aria-label={`Open image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className={styles.thumbImage}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
