"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/admin-data';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

function statusClass(status: string): string {
  if (status === 'Delivered') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Shipped' || status === 'Processing' || status === 'Confirmed') {
    return `${styles.badge} ${styles.badgeInfo}`;
  }
  if (status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

function paymentClass(status: string): string {
  if (status === 'Paid') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Awaiting Payment' || status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  if (status === 'Partial') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

function normalizeLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface AdminOrderItem {
  productName: string;
  quantity: number;
  lineTotal: number;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedFabric: string | null;
}

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  date: string;
  total: number;
  items: number;
  orderItems: AdminOrderItem[];
  payment: 'Awaiting Payment' | 'Pending' | 'Paid' | 'Partial' | 'Failed' | 'Placeholder';
  fulfillment: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
}

interface AdminOrderDetails extends AdminOrderRow {
  customerPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  deliveryType: string;
  deliveryFee: number;
  paymentMethod: string;
  paymentReference: string | null;
  paymentReceivedAt: string | null;
  paymentSettledAt: string | null;
  promoDiscount: number;
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<AdminOrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useToastFeedback({ error });

  const loadOrders = useCallback(async (orderNumberQuery: string) => {
    setLoading(true);
    setError('');

    try {
      const search = orderNumberQuery.trim();
      const endpoint = search
        ? `/api/admin/orders?q=${encodeURIComponent(search)}`
        : '/api/admin/orders';

      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = (await res.json()) as { orders?: AdminOrderRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load orders.');
      }

      setOrders(data.orders ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load orders.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchInput]);

  useEffect(() => {
    void loadOrders(searchQuery);
  }, [loadOrders, searchQuery]);

  useEffect(() => {
    if (!detailsOrderId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailsOrderId(null);
        setDetailsOrder(null);
        setDetailsError('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailsOrderId]);

  const closeDetailsModal = () => {
    setDetailsOrderId(null);
    setDetailsOrder(null);
    setDetailsError('');
    setDetailsLoading(false);
  };

  const openDetailsModal = async (order: AdminOrderRow) => {
    setDetailsOrderId(order.id);
    setDetailsOrder(null);
    setDetailsError('');
    setDetailsLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { cache: 'no-store' });
      const data = (await res.json()) as { order?: AdminOrderDetails; error?: string };

      if (!res.ok || !data.order) {
        throw new Error(data.error ?? 'Could not load order details.');
      }

      setDetailsOrder(data.order);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load order details.';
      setDetailsError(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateOrder = async (order: AdminOrderRow) => {
    setSavingId(order.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillment: order.fulfillment,
          payment: order.payment,
        }),
      });

      const data = (await res.json()) as { order?: AdminOrderRow; error?: string };
      if (!res.ok || !data.order) {
        throw new Error(data.error ?? 'Could not update order.');
      }

      setOrders((prev) => prev.map((row) => (row.id === order.id ? data.order! : row)));
      toast.success('Order updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update order.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Order Queue</h2>
      <div className={styles.formRow} style={{ marginBottom: '0.8rem', maxWidth: '440px' }}>
        <label className={styles.label}>Search Order ID</label>
        <input
          className={styles.input}
          placeholder="Search exact Order ID: ZE-2026-112142"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      {loading ? <p style={{ color: '#a9b7c9' }}>Loading orders...</p> : null}
      {error ? <p style={{ color: '#ffd0d0' }}>{error}</p> : null}
      {!loading && !error && orders.length === 0 && searchQuery ? (
        <p style={{ color: '#a9b7c9', marginBottom: '0.75rem' }}>
          No orders found for {searchQuery}.
        </p>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>{order.customer}</td>
                <td>{order.customerEmail}</td>
                <td>{order.date}</td>
                <td>
                  <p className={styles.orderItemsCount}>{order.items}</p>
                  {searchQuery ? (
                    <div className={styles.orderItemsDetailList}>
                      {(order.orderItems ?? []).map((item, index) => (
                        <article
                          className={styles.orderItemDetail}
                          key={`${order.id}-${item.productName}-${index}`}
                        >
                          <p className={styles.orderItemName}>{item.productName}</p>
                          <p className={styles.orderItemMeta}>
                            Qty: {item.quantity} · Line Total: {formatCurrency(item.lineTotal)}
                          </p>
                          {item.selectedColor ? (
                            <p className={styles.orderItemMeta}>Color: {item.selectedColor}</p>
                          ) : null}
                          {item.selectedSize ? (
                            <p className={styles.orderItemMeta}>Size: {item.selectedSize}</p>
                          ) : null}
                          {item.selectedFabric ? (
                            <p className={styles.orderItemMeta}>Fabric: {item.selectedFabric}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <select
                    className={styles.select}
                    value={order.payment}
                    onChange={(e) =>
                      setOrders((prev) =>
                        prev.map((row) =>
                          row.id === order.id
                            ? {
                                ...row,
                                payment: e.target.value as AdminOrderRow['payment'],
                              }
                            : row
                        )
                      )
                    }
                  >
                    <option>Awaiting Payment</option>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Partial</option>
                    <option>Failed</option>
                    <option>Placeholder</option>
                  </select>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={paymentClass(order.payment)}>{order.payment}</span>
                  </div>
                </td>
                <td>
                  <select
                    className={styles.select}
                    value={order.fulfillment}
                    onChange={(e) =>
                      setOrders((prev) =>
                        prev.map((row) =>
                          row.id === order.id
                            ? {
                                ...row,
                                fulfillment: e.target.value as AdminOrderRow['fulfillment'],
                              }
                            : row
                        )
                      )
                    }
                  >
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={statusClass(order.fulfillment)}>{order.fulfillment}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.inlineActions}>
                    <button
                      className={styles.ghostButton}
                      disabled={detailsLoading && detailsOrderId === order.id}
                      onClick={() => {
                        void openDetailsModal(order);
                      }}
                    >
                      {detailsLoading && detailsOrderId === order.id ? 'Loading...' : 'Details'}
                    </button>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === order.id}
                      onClick={() => updateOrder(order)}
                    >
                      {savingId === order.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailsOrderId ? (
        <div className={styles.modalOverlay} onClick={closeDetailsModal}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Order Details</h3>
                <p className={styles.modalMeta}>{detailsOrder?.orderNumber ?? 'Loading order...'}</p>
              </div>
              <button className={styles.ghostButton} onClick={closeDetailsModal}>
                Close
              </button>
            </header>
            <div className={styles.modalBody}>
              {detailsLoading ? <p style={{ color: '#a9b7c9' }}>Loading full order details...</p> : null}
              {detailsError ? <p style={{ color: '#ffd0d0' }}>{detailsError}</p> : null}

              {!detailsLoading && !detailsError && detailsOrder ? (
                <>
                  <div className={styles.detailsGrid}>
                    <section className={styles.detailCard}>
                      <h4 className={styles.detailHeading}>Order Summary</h4>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Order ID</span>
                        <span className={styles.detailValue}>{detailsOrder.orderNumber}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Date</span>
                        <span className={styles.detailValue}>{detailsOrder.date}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Total</span>
                        <span className={styles.detailValue}>{formatCurrency(detailsOrder.total)}</span>
                      </p>
                      <div className={styles.detailBadges}>
                        <span className={paymentClass(detailsOrder.payment)}>{detailsOrder.payment}</span>
                        <span className={statusClass(detailsOrder.fulfillment)}>{detailsOrder.fulfillment}</span>
                      </div>
                    </section>

                    <section className={styles.detailCard}>
                      <h4 className={styles.detailHeading}>Customer</h4>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Name</span>
                        <span className={styles.detailValue}>{detailsOrder.customer}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{detailsOrder.customerEmail}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Phone</span>
                        <span className={styles.detailValue}>{detailsOrder.customerPhone}</span>
                      </p>
                    </section>

                    <section className={styles.detailCard}>
                      <h4 className={styles.detailHeading}>Delivery Address</h4>
                      <p className={styles.detailAddress}>{detailsOrder.address}</p>
                      <p className={styles.detailAddress}>
                        {detailsOrder.city}, {normalizeLabel(detailsOrder.province)} {detailsOrder.postalCode}
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Delivery Type</span>
                        <span className={styles.detailValue}>{normalizeLabel(detailsOrder.deliveryType)}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Delivery Fee</span>
                        <span className={styles.detailValue}>{formatCurrency(detailsOrder.deliveryFee)}</span>
                      </p>
                    </section>

                    <section className={styles.detailCard}>
                      <h4 className={styles.detailHeading}>Payment</h4>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Method</span>
                        <span className={styles.detailValue}>{normalizeLabel(detailsOrder.paymentMethod)}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Reference</span>
                        <span className={styles.detailValue}>{detailsOrder.paymentReference ?? '-'}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Received</span>
                        <span className={styles.detailValue}>{formatDateTime(detailsOrder.paymentReceivedAt)}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Settled</span>
                        <span className={styles.detailValue}>{formatDateTime(detailsOrder.paymentSettledAt)}</span>
                      </p>
                      <p className={styles.detailLine}>
                        <span className={styles.detailLabel}>Promo Discount</span>
                        <span className={styles.detailValue}>{formatCurrency(detailsOrder.promoDiscount)}</span>
                      </p>
                    </section>
                  </div>

                  <section className={styles.detailItemsSection}>
                    <h4 className={styles.detailHeading}>Items</h4>
                    <div className={styles.orderItemsDetailList}>
                      {detailsOrder.orderItems.map((item, index) => (
                        <article
                          className={styles.orderItemDetail}
                          key={`${detailsOrder.id}-${item.productName}-${index}`}
                        >
                          <p className={styles.orderItemName}>{item.productName}</p>
                          <p className={styles.orderItemMeta}>
                            Qty: {item.quantity} · Line Total: {formatCurrency(item.lineTotal)}
                          </p>
                          {item.selectedColor ? (
                            <p className={styles.orderItemMeta}>Color: {item.selectedColor}</p>
                          ) : null}
                          {item.selectedSize ? (
                            <p className={styles.orderItemMeta}>Size: {item.selectedSize}</p>
                          ) : null}
                          {item.selectedFabric ? (
                            <p className={styles.orderItemMeta}>Fabric: {item.selectedFabric}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}
            </div>
            <footer className={styles.modalFooter}>
              <button className={styles.ghostButton} onClick={closeDetailsModal}>
                Close
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
