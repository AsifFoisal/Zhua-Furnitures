import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/data';

// ── Cart ──────────────────────────────────────────────────────────────

const LEGACY_CART_STORAGE_KEY = 'zhua-cart';
const GUEST_CART_STORAGE_KEY = 'zhua-cart-guest';
const USER_SCOPE_PREFIX = 'user:';
const REMOTE_SYNC_DELAY_MS = 350;

let remoteSyncTimer: ReturnType<typeof setTimeout> | null = null;

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
  selectedFabric?: string;
  customNote?: string;
}

interface CartStore {
  items: CartItem[];
  guestItems: CartItem[];
  scopeKey: string;
  hydrated: boolean;
  syncing: boolean;
  isOpen: boolean;
  hydrateForGuest: () => void;
  hydrateForUser: (userId: string) => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string) => void;
  updateQuantity: (productId: string, color: string, quantity: number) => void;
  clearCart: () => void;
  flushRemoteSync: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function toColorList(value: unknown): { name: string; hex: string }[] {
  if (!Array.isArray(value)) {
    return [{ name: 'Default', hex: '#B59241' }];
  }

  const colors = value
    .map((entry) => {
      if (!isObjectLike(entry)) {
        return null;
      }

      const name = toStringValue(entry.name);
      const hex = toStringValue(entry.hex);
      if (!name || !hex) {
        return null;
      }

      return { name, hex };
    })
    .filter((entry): entry is { name: string; hex: string } => Boolean(entry));

  return colors.length > 0 ? colors : [{ name: 'Default', hex: '#B59241' }];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function toSafeBadge(value: unknown): Product['badge'] {
  if (value === 'new' || value === 'sale' || value === 'custom' || value === 'bestseller') {
    return value;
  }

  return undefined;
}

function toSafeProduct(value: unknown): Product | null {
  if (!isObjectLike(value)) {
    return null;
  }

  const id = toStringValue(value.id);
  const slug = toStringValue(value.slug);
  const name = toStringValue(value.name);
  const price = Math.max(0, Math.round(toNumberValue(value.price, -1)));

  if (!id || !slug || !name || price < 0) {
    return null;
  }

  const categoryValue = toStringValue(value.category);
  const category: Product['category'] =
    categoryValue === 'curtains' || categoryValue === 'accessories' ? categoryValue : 'furniture';

  const dimensionsSource = isObjectLike(value.dimensions) ? value.dimensions : {};

  return {
    id,
    slug,
    name,
    category,
    subcategory: toStringValue(value.subcategory, 'General'),
    price,
    originalPrice: Number.isFinite(value.originalPrice) ? Math.max(0, Math.round(Number(value.originalPrice))) : undefined,
    rating: Math.max(0, toNumberValue(value.rating, 5)),
    reviewCount: Math.max(0, Math.round(toNumberValue(value.reviewCount, 0))),
    badge: toSafeBadge(value.badge),
    description: toStringValue(value.description),
    longDescription: toStringValue(value.longDescription),
    images: toStringArray(value.images),
    colors: toColorList(value.colors),
    sizes: toStringArray(value.sizes),
    fabrics: toStringArray(value.fabrics),
    inStock: Boolean(value.inStock),
    isCustomizable: Boolean(value.isCustomizable),
    deliveryDays: toStringValue(value.deliveryDays, '7-14 business days'),
    weightKg: Math.max(0, toNumberValue(value.weightKg, 0)),
    dimensions: {
      widthCm: Math.max(0, toNumberValue(dimensionsSource.widthCm, 0)),
      depthCm: Math.max(0, toNumberValue(dimensionsSource.depthCm, 0)),
      heightCm: Math.max(0, toNumberValue(dimensionsSource.heightCm, 0)),
    },
    features: toStringArray(value.features),
  };
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!isObjectLike(value)) {
    return null;
  }

  const product = toSafeProduct(value.product);
  if (!product) {
    return null;
  }

  const quantity = Math.max(1, Math.round(toNumberValue(value.quantity, 1)));
  const selectedColor = toStringValue(value.selectedColor);

  if (!selectedColor) {
    return null;
  }

  const selectedSize = toStringValue(value.selectedSize);
  const selectedFabric = toStringValue(value.selectedFabric);
  const customNote = toStringValue(value.customNote);

  return {
    product,
    quantity,
    selectedColor,
    selectedSize: selectedSize || undefined,
    selectedFabric: selectedFabric || undefined,
    customNote: customNote || undefined,
  };
}

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeCartItem(entry))
    .filter((entry): entry is CartItem => Boolean(entry));
}

function cancelRemoteSyncTimer() {
  if (remoteSyncTimer) {
    clearTimeout(remoteSyncTimer);
    remoteSyncTimer = null;
  }
}

async function fetchAccountCart(): Promise<CartItem[]> {
  const res = await fetch('/api/account/cart', { cache: 'no-store' });
  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as { items?: unknown };
  return normalizeCartItems(data.items);
}

async function putAccountCart(items: CartItem[]): Promise<CartItem[]> {
  const res = await fetch('/api/account/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    throw new Error('Could not sync account cart.');
  }

  const data = (await res.json()) as { items?: unknown };
  return normalizeCartItems(data.items);
}

function readLegacyCartItems(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { items?: unknown } };
    return normalizeCartItems(parsed?.state?.items);
  } catch {
    return [];
  }
}

function readGuestPersistedItems(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { guestItems?: unknown } };
    return normalizeCartItems(parsed?.state?.guestItems);
  } catch {
    return [];
  }
}

function removeLegacyCartStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      guestItems: [],
      scopeKey: 'guest',
      hydrated: false,
      syncing: false,
      isOpen: false,

      hydrateForGuest: () => {
        cancelRemoteSyncTimer();

        let nextGuestItems = normalizeCartItems(get().guestItems);
        if (nextGuestItems.length === 0) {
          nextGuestItems = readGuestPersistedItems();
        }
        if (nextGuestItems.length === 0) {
          nextGuestItems = readLegacyCartItems();
        }

        removeLegacyCartStorage();

        set({
          scopeKey: 'guest',
          items: nextGuestItems,
          guestItems: nextGuestItems,
          hydrated: true,
          syncing: false,
          isOpen: false,
        });
      },

      hydrateForUser: async (userId) => {
        const normalizedUserId = toStringValue(userId);
        if (!normalizedUserId) {
          get().hydrateForGuest();
          return;
        }

        cancelRemoteSyncTimer();
        const scopeKey = `${USER_SCOPE_PREFIX}${normalizedUserId}`;
        removeLegacyCartStorage();

        set({
          scopeKey,
          items: [],
          guestItems: [],
          hydrated: false,
          syncing: false,
          isOpen: false,
        });

        try {
          const items = await fetchAccountCart();
          if (get().scopeKey !== scopeKey) {
            return;
          }

          set({ items, hydrated: true });
        } catch {
          if (get().scopeKey !== scopeKey) {
            return;
          }

          set({ items: [], hydrated: true });
        }
      },

      flushRemoteSync: async () => {
        cancelRemoteSyncTimer();

        if (!get().scopeKey.startsWith(USER_SCOPE_PREFIX)) {
          return;
        }

        const scopeKey = get().scopeKey;

        set({ syncing: true });
        try {
          const syncedItems = await putAccountCart(get().items);
          if (get().scopeKey === scopeKey) {
            set({ items: syncedItems });
          }
        } catch {
          // Best effort: cart stays local if remote sync is temporarily unavailable.
        } finally {
          set({ syncing: false });
        }
      },

      addItem: (newItem) => {
        if (!newItem.product.inStock) {
          return;
        }

        const commitItems = (nextItems: CartItem[]) => {
          if (get().scopeKey === 'guest') {
            set({ items: nextItems, guestItems: nextItems });
            return;
          }

          set({ items: nextItems });
          cancelRemoteSyncTimer();
          remoteSyncTimer = setTimeout(() => {
            void get().flushRemoteSync();
          }, REMOTE_SYNC_DELAY_MS);
        };

        const existing = get().items.find(
          (i) => i.product.id === newItem.product.id && i.selectedColor === newItem.selectedColor
        );

        if (existing) {
          const updated = get().items.map((i) =>
              i.product.id === newItem.product.id && i.selectedColor === newItem.selectedColor
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            );

          commitItems(updated);
        } else {
          commitItems([...get().items, newItem]);
        }

        set({ isOpen: true });
      },

      removeItem: (productId, color) => {
        const nextItems = get().items.filter(
            (i) => !(i.product.id === productId && i.selectedColor === color)
          );

        if (get().scopeKey === 'guest') {
          set({ items: nextItems, guestItems: nextItems });
          return;
        }

        set({ items: nextItems });
        cancelRemoteSyncTimer();
        remoteSyncTimer = setTimeout(() => {
          void get().flushRemoteSync();
        }, REMOTE_SYNC_DELAY_MS);
      },

      updateQuantity: (productId, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color);
          return;
        }

        const currentItem = get().items.find(
          (item) => item.product.id === productId && item.selectedColor === color
        );

        if (!currentItem) {
          return;
        }

        if (!currentItem.product.inStock && quantity > currentItem.quantity) {
          return;
        }

        const nextItems = get().items.map((i) =>
            i.product.id === productId && i.selectedColor === color
              ? { ...i, quantity }
              : i
          );

        if (get().scopeKey === 'guest') {
          set({ items: nextItems, guestItems: nextItems });
          return;
        }

        set({ items: nextItems });
        cancelRemoteSyncTimer();
        remoteSyncTimer = setTimeout(() => {
          void get().flushRemoteSync();
        }, REMOTE_SYNC_DELAY_MS);
      },

      clearCart: () => {
        if (get().scopeKey === 'guest') {
          set({ items: [], guestItems: [] });
          return;
        }

        set({ items: [] });
        cancelRemoteSyncTimer();
        remoteSyncTimer = setTimeout(() => {
          void get().flushRemoteSync();
        }, REMOTE_SYNC_DELAY_MS);
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: GUEST_CART_STORAGE_KEY,
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
);

// ── Wishlist ──────────────────────────────────────────────────────────

interface WishlistStore {
  ids: string[];
  hydrated: boolean;
  setIds: (ids: string[]) => void;
  init: () => Promise<void>;
  toggle: (id: string) => Promise<void>;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      setIds: (ids) => set({ ids }),
      init: async () => {
        if (get().hydrated) {
          return;
        }

        set({ hydrated: true });

        try {
          const res = await fetch('/api/account/wishlist', { cache: 'no-store' });
          if (!res.ok) {
            return;
          }

          const data = (await res.json()) as { ids?: string[] };
          if (Array.isArray(data.ids)) {
            set({ ids: data.ids });
          }
        } catch {
          // Guests or transient network issues should keep local persisted state.
        }
      },
      toggle: async (id) => {
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((entry) => entry !== id)
            : [...state.ids, id],
        }));

        try {
          const res = await fetch('/api/account/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, mode: 'toggle' }),
          });

          if (!res.ok) {
            return;
          }

          const data = (await res.json()) as { ids?: string[] };
          if (Array.isArray(data.ids)) {
            set({ ids: data.ids });
          }
        } catch {
          // Keep optimistic local state when remote sync fails.
        }
      },
      has: (id) => get().ids.includes(id),
    }),
    {
      name: 'zhua-wishlist',
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);

// ── Search ────────────────────────────────────────────────────────────

interface SearchStore {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
}

export const useSearchStore = create<SearchStore>()((set) => ({
  isOpen: false,
  query: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  setQuery: (q) => set({ query: q }),
}));
