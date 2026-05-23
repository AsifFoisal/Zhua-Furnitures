import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { displayFulfillmentStatus } from '@/lib/admin-api';
import AdminOverviewAutoRefresh from '@/components/admin/AdminOverviewAutoRefresh';
import AdminTransactionExportControls from '@/components/admin/AdminTransactionExportControls';
import styles from './admin-pages.module.css';

export const dynamic = 'force-dynamic';

type DashboardOrderRow = {
  id: string;
  customer: string;
  date: string;
  items: number;
  totalRand: number;
  status: string;
};

function formatCurrency(value: number): string {
  return `R ${value.toLocaleString('en-ZA')}`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function formatDelta(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? '0.0%' : '+100.0%';
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function toIsoDate(value: string): string {
  return value.slice(0, 10);
}

function statusClass(status: string): string {
  if (status === 'Delivered') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Shipped' || status === 'Processing' || status === 'Confirmed') {
    return `${styles.badge} ${styles.badgeInfo}`;
  }
  if (status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const currentExportYear = now.getUTCFullYear();
  const currentExportMonth = now.getUTCMonth() + 1;
  const exportYearOptions = Array.from({ length: 6 }, (_, index) => currentExportYear - index);
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentStartMs = nowMs - 30 * dayMs;
  const previousStartMs = nowMs - 60 * dayMs;
  const chartStartMs = nowMs - 56 * dayMs;

  const [ordersResult, productsResult, webhookRetriesResult, scheduledBlocksResult] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, created_at, total_cents, payment_status, fulfillment_status, order_items(quantity)'
      )
      .order('created_at', { ascending: false })
      .limit(400),
    supabase.from('products').select('id').eq('status', 'active').lte('stock', 0),
    supabase
      .from('payment_webhook_events')
      .select('id', { head: true, count: 'exact' })
      .in('processing_status', ['received', 'failed']),
    supabase
      .from('content_blocks')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'scheduled'),
  ]);

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message);
  }

  const orders = ordersResult.data ?? [];
  const paidStatuses = new Set(['paid']);
  const failedStatuses = new Set(['failed']);

  let currentRevenueCents = 0;
  let previousRevenueCents = 0;
  let currentOrderCount = 0;
  let previousOrderCount = 0;
  let currentPaidCount = 0;
  let previousPaidCount = 0;
  let currentFailedCount = 0;
  let previousFailedCount = 0;

  const chartBins = Array.from({ length: 8 }, () => 0);

  orders.forEach((order) => {
    const createdMs = new Date(order.created_at).getTime();
    const isCurrent = createdMs >= currentStartMs;
    const isPrevious = createdMs >= previousStartMs && createdMs < currentStartMs;
    const isPaid = paidStatuses.has(order.payment_status);
    const isFailed = failedStatuses.has(order.payment_status);

    if (isCurrent) {
      currentOrderCount += 1;
      if (isPaid) {
        currentPaidCount += 1;
        currentRevenueCents += order.total_cents;
      }
      if (isFailed) {
        currentFailedCount += 1;
      }
    } else if (isPrevious) {
      previousOrderCount += 1;
      if (isPaid) {
        previousPaidCount += 1;
        previousRevenueCents += order.total_cents;
      }
      if (isFailed) {
        previousFailedCount += 1;
      }
    }

    if (isPaid && createdMs >= chartStartMs) {
      const diffFromStart = createdMs - chartStartMs;
      const bucket = Math.floor(diffFromStart / (7 * dayMs));
      if (bucket >= 0 && bucket < chartBins.length) {
        chartBins[bucket] += order.total_cents;
      }
    }
  });

  const currentConversion = currentOrderCount > 0 ? (currentPaidCount / currentOrderCount) * 100 : 0;
  const previousConversion = previousOrderCount > 0 ? (previousPaidCount / previousOrderCount) * 100 : 0;
  const currentRefund = currentOrderCount > 0 ? (currentFailedCount / currentOrderCount) * 100 : 0;
  const previousRefund = previousOrderCount > 0 ? (previousFailedCount / previousOrderCount) * 100 : 0;

  const adminMetrics = [
    {
      label: 'Gross Revenue',
      value: formatCurrency(Math.round(currentRevenueCents / 100)),
      change: formatDelta(currentRevenueCents, previousRevenueCents),
      trend: currentRevenueCents >= previousRevenueCents ? 'up' : 'down',
      note: 'vs last 30 days',
    },
    {
      label: 'Orders',
      value: String(currentOrderCount),
      change: formatDelta(currentOrderCount, previousOrderCount),
      trend: currentOrderCount >= previousOrderCount ? 'up' : 'down',
      note: 'vs previous 30 days',
    },
    {
      label: 'Conversion Rate',
      value: `${clampPercent(currentConversion).toFixed(2)}%`,
      change: formatDelta(currentConversion, previousConversion),
      trend: currentConversion >= previousConversion ? 'up' : 'down',
      note: 'paid checkouts',
    },
    {
      label: 'Refund Rate',
      value: `${clampPercent(currentRefund).toFixed(2)}%`,
      change: formatDelta(currentRefund, previousRefund),
      trend: currentRefund <= previousRefund ? 'down' : 'up',
      note: 'failed payments',
    },
  ];

  const maxChartValue = Math.max(...chartBins, 1);
  const revenueByWeek = chartBins.map((value, index) => {
    const ratio = value / maxChartValue;
    return {
      week: `W${index + 1}`,
      value: Math.max(8, Math.round(ratio * 88)),
    };
  });

  const awaitingFulfillmentCount = orders.filter(
    (order) => order.fulfillment_status === 'pending' || order.fulfillment_status === 'processing'
  ).length;
  const awaitingPaymentCount = orders.filter(
    (order) => order.payment_status === 'awaiting_payment' || order.payment_status === 'pending'
  ).length;
  const lowStockCount = productsResult.data?.length ?? 0;
  const webhookRetriesCount = webhookRetriesResult.count ?? 0;
  const scheduledContentCount = scheduledBlocksResult.count ?? 0;

  const adminAlerts = [
    `${awaitingFulfillmentCount} orders are waiting for fulfillment assignment.`,
    `${awaitingPaymentCount} orders are awaiting payment confirmation.`,
    `${lowStockCount} active products are out of stock.`,
    `${webhookRetriesCount} payment webhook events need attention.`,
  ];

  if (scheduledContentCount > 0) {
    adminAlerts.push(`${scheduledContentCount} content blocks are currently scheduled.`);
  }

  const adminOrders: DashboardOrderRow[] = orders.slice(0, 8).map((order) => {
    const itemCount = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);
    return {
      id: order.order_number,
      customer: order.customer_name,
      date: toIsoDate(order.created_at),
      items: itemCount,
      totalRand: Math.round(order.total_cents / 100),
      status: displayFulfillmentStatus(order.fulfillment_status),
    };
  });

  return (
    <>
      <AdminOverviewAutoRefresh />
      <AdminTransactionExportControls
        initialMonth={currentExportMonth}
        initialYear={currentExportYear}
        yearOptions={exportYearOptions}
      />

      <section className={styles.grid4}>
        {adminMetrics.map((metric) => (
          <article key={metric.label} className={styles.card}>
            <p className={styles.cardTitle}>{metric.label}</p>
            <p className={styles.kpiValue}>{metric.value}</p>
            <p className={styles.kpiMeta}>
              <span className={metric.trend === 'up' ? styles.kpiUp : styles.kpiDown}>{metric.change}</span> {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Revenue Trend</h2>
          <div className={styles.chart}>
            {revenueByWeek.map((point) => (
              <div key={point.week} className={styles.chartCol}>
                <div className={styles.chartBar} style={{ height: `${point.value}%` }} />
                <span className={styles.chartLabel}>{point.week}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Operational Alerts</h2>
          <div className={styles.alertList}>
            {adminAlerts.map((alert) => (
              <div key={alert} className={styles.alertItem}>
                {alert}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Latest Orders</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>{order.items}</td>
                  <td>{formatCurrency(order.totalRand)}</td>
                  <td>
                    <span className={statusClass(order.status)}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
