export type ProductCategory = 'furniture' | 'curtains' | 'accessories';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type ProductBadge = 'new' | 'sale' | 'custom' | 'bestseller';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus =
  | 'awaiting_payment'
  | 'pending'
  | 'paid'
  | 'partial'
  | 'failed'
  | 'placeholder';

const productCategoryMap: Record<ProductCategory, string> = {
  furniture: 'Furniture',
  curtains: 'Curtains',
  accessories: 'Accessories',
};

const productStatusMap: Record<ProductStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

const productBadgeMap: Record<ProductBadge, string> = {
  new: 'new',
  sale: 'sale',
  custom: 'custom',
  bestseller: 'bestseller',
};

const fulfillmentStatusMap: Record<FulfillmentStatus, string> = {
  pending: 'Pending',
  processing: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const paymentStatusMap: Record<PaymentStatus, string> = {
  awaiting_payment: 'Awaiting Payment',
  pending: 'Pending',
  paid: 'Paid',
  partial: 'Partial',
  failed: 'Failed',
  placeholder: 'Placeholder',
};

export function displayCategory(category: ProductCategory): string {
  return productCategoryMap[category];
}

export function parseCategory(value: string): ProductCategory {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'furniture' || normalized === 'curtains' || normalized === 'accessories') {
    return normalized;
  }

  return 'furniture';
}

export function displayProductStatus(status: ProductStatus): string {
  return productStatusMap[status];
}

export function parseProductStatus(value: string): ProductStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'draft' || normalized === 'archived') {
    return normalized;
  }

  return 'draft';
}

export function displayProductBadge(badge: ProductBadge): string {
  return productBadgeMap[badge];
}

export function parseProductBadge(value: unknown): ProductBadge | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'new' ||
    normalized === 'sale' ||
    normalized === 'custom' ||
    normalized === 'bestseller'
  ) {
    return normalized;
  }

  return null;
}

export function displayFulfillmentStatus(status: FulfillmentStatus): string {
  return fulfillmentStatusMap[status];
}

export function parseFulfillmentStatus(value: string): FulfillmentStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'pending' ||
    normalized === 'processing' ||
    normalized === 'confirmed' ||
    normalized === 'shipped' ||
    normalized === 'delivered' ||
    normalized === 'cancelled'
  ) {
    if (normalized === 'confirmed') {
      return 'processing';
    }

    return normalized;
  }

  return 'pending';
}

export function displayPaymentStatus(status: PaymentStatus): string {
  return paymentStatusMap[status];
}

export function parsePaymentStatus(value: string): PaymentStatus {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  if (
    normalized === 'awaiting_payment' ||
    normalized === 'pending' ||
    normalized === 'paid' ||
    normalized === 'partial' ||
    normalized === 'failed' ||
    normalized === 'placeholder'
  ) {
    return normalized;
  }

  return 'placeholder';
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatOrderNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}
