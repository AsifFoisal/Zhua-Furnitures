'use client';

import { Suspense } from 'react';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

function showToast(type: ToastType, message: string) {
  if (type === 'success') {
    toast.success(message);
    return;
  }

  if (type === 'error') {
    toast.error(message);
    return;
  }

  if (type === 'warning') {
    toast.warning(message);
    return;
  }

  toast.info(message);
}

function ToastQueryBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTokenRef = useRef<string>('');

  useEffect(() => {
    const message = searchParams.get('toast');
    if (!message) {
      return;
    }

    const rawType = searchParams.get('toastType');
    const type: ToastType =
      rawType === 'success' || rawType === 'error' || rawType === 'warning' ? rawType : 'info';

    const token = `${type}:${message}:${pathname}`;
    if (token === lastTokenRef.current) {
      return;
    }

    showToast(type, message);
    lastTokenRef.current = token;

    const next = new URLSearchParams(searchParams.toString());
    next.delete('toast');
    next.delete('toastType');

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

export default function AppToaster() {
  return (
    <>
      <Suspense fallback={null}>
        <ToastQueryBridge />
      </Suspense>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
        toastOptions={{
          style: {
            background: 'var(--charcoal)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(181,146,65,0.3)',
          },
        }}
      />
    </>
  );
}
