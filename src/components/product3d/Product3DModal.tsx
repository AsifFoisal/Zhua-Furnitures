'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { Box, RotateCcw, TriangleAlert, X } from 'lucide-react';
import styles from './Product3DModal.module.css';

const Product3DViewer = dynamic(() => import('./Product3DViewer'), {
  ssr: false,
  loading: () => null,
});

type Product3DModalProps = {
  modelUrl: string;
  productName: string;
  onClose: () => void;
};

type BoundaryState = { hasError: boolean };

/** Keeps a failed/broken GLB from blanking the whole modal. */
class ViewerErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorState}>
          <TriangleAlert size={26} aria-hidden="true" />
          <p>This 3D model could not be displayed. Please try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Mounted only while the 3D preview is open, so the viewer (and its loading
 * state) start fresh on every open.
 */
export default function Product3DModal({
  modelUrl,
  productName,
  onClose,
}: Product3DModalProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${productName} 3D preview`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.title}>
            <Box size={15} aria-hidden="true" /> {productName}
          </p>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close 3D preview"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.viewerViewport}>
          <ViewerErrorBoundary>
            <Product3DViewer modelUrl={modelUrl} onLoaded={() => setIsReady(true)} />
          </ViewerErrorBoundary>

          {!isReady ? (
            <div className={styles.loadingState} aria-live="polite">
              <RotateCcw className={styles.spinner} size={26} aria-hidden="true" />
              <p>Loading 3D model…</p>
            </div>
          ) : null}
        </div>

        <footer className={styles.footer}>
          <span>Drag to rotate</span>
          <span aria-hidden="true">·</span>
          <span>Scroll or pinch to zoom</span>
        </footer>
      </div>
    </div>,
    document.body
  );
}
