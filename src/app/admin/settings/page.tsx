'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  type DeliveryZone,
} from '@/lib/delivery';
import styles from '../admin-pages.module.css';

type DeliveryApiResponse = {
  delivery?: {
    freeShippingThreshold: number;
    zones: DeliveryZone[];
  };
  error?: string;
};

export default function SettingsAdminPage() {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [savingDelivery, setSavingDelivery] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadDeliverySettings = async () => {
      setLoadingDelivery(true);

      try {
        const res = await fetch('/api/admin/delivery');
        const data = (await res.json()) as DeliveryApiResponse;

        if (
          ignore ||
          !res.ok ||
          !data.delivery ||
          !Array.isArray(data.delivery.zones) ||
          data.delivery.zones.length === 0
        ) {
          throw new Error(data.error ?? 'Could not load delivery settings.');
        }

        setFreeShippingThreshold(Number(data.delivery.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD));
        setDeliveryZones(data.delivery.zones);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load delivery settings.';
        toast.error(message);
      } finally {
        if (!ignore) {
          setLoadingDelivery(false);
        }
      }
    };

    void loadDeliverySettings();

    return () => {
      ignore = true;
    };
  }, []);

  const updateZone = (
    id: string,
    field: 'standardFee' | 'expressFee' | 'standardDays' | 'expressDays',
    value: string
  ) => {
    setDeliveryZones((current) =>
      current.map((zone) => {
        if (zone.id !== id) {
          return zone;
        }

        if (field === 'standardFee' || field === 'expressFee') {
          return {
            ...zone,
            [field]: Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0,
          };
        }

        return {
          ...zone,
          [field]: value,
        };
      })
    );
  };

  const saveDeliverySettings = async () => {
    setSavingDelivery(true);

    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold,
          zones: deliveryZones,
        }),
      });

      const data = (await res.json()) as DeliveryApiResponse;
      if (!res.ok || !data.delivery) {
        throw new Error(data.error ?? 'Could not update delivery settings.');
      }

      setFreeShippingThreshold(Number(data.delivery.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD));
      setDeliveryZones(data.delivery.zones);
      toast.success('Delivery pricing updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update delivery settings.';
      toast.error(message);
    } finally {
      setSavingDelivery(false);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Store Preferences</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Store Name</label>
            <input className={styles.input} defaultValue="Zhua Furniture" />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Support Email</label>
            <input className={styles.input} defaultValue="zhuaenterprise@gmail.com" />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Default Currency</label>
            <select className={styles.select} defaultValue="ZAR">
              <option value="ZAR">ZAR (R)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Order Prefix</label>
            <input className={styles.input} defaultValue="ZE-2026" />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Automation Toggles</h2>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Auto-confirm payments</p>
              <p className={styles.switchDesc}>Mark paid orders as confirmed after gateway success.</p>
            </div>
            <span className={styles.toggle} />
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Low-stock alerts</p>
              <p className={styles.switchDesc}>Send internal alerts when stock falls below threshold.</p>
            </div>
            <span className={styles.toggle} />
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Review moderation queue</p>
              <p className={styles.switchDesc}>Hold new reviews for manual approval before publishing.</p>
            </div>
            <span className={styles.toggle} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Delivery Pricing</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
          Configure the free-shipping threshold and province-level standard/express delivery charges.
        </p>

        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Free Shipping Threshold (R)</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step="1"
              value={freeShippingThreshold}
              onChange={(event) => {
                const value = Number(event.target.value);
                setFreeShippingThreshold(Number.isFinite(value) ? Math.max(0, value) : 0);
              }}
              disabled={loadingDelivery || savingDelivery}
            />
          </div>
        </div>

        <div className={styles.tableWrap} style={{ marginTop: '0.9rem' }}>
          <table className={styles.table} style={{ minWidth: '980px' }}>
            <thead>
              <tr>
                <th>Province</th>
                <th>Standard Fee (R)</th>
                <th>Express Fee (R)</th>
                <th>Standard Days</th>
                <th>Express Days</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.map((zone) => (
                <tr key={zone.id}>
                  <td>
                    {zone.name}
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{zone.id}</div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      type="number"
                      min={0}
                      step="1"
                      value={zone.standardFee}
                      onChange={(event) => updateZone(zone.id, 'standardFee', event.target.value)}
                      disabled={loadingDelivery || savingDelivery}
                      style={{ maxWidth: '8.5rem' }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      type="number"
                      min={0}
                      step="1"
                      value={zone.expressFee}
                      onChange={(event) => updateZone(zone.id, 'expressFee', event.target.value)}
                      disabled={loadingDelivery || savingDelivery}
                      style={{ maxWidth: '8.5rem' }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={zone.standardDays}
                      onChange={(event) => updateZone(zone.id, 'standardDays', event.target.value)}
                      disabled={loadingDelivery || savingDelivery}
                      style={{ maxWidth: '10rem' }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={zone.expressDays}
                      onChange={(event) => updateZone(zone.id, 'expressDays', event.target.value)}
                      disabled={loadingDelivery || savingDelivery}
                      style={{ maxWidth: '10rem' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => void saveDeliverySettings()}
            disabled={loadingDelivery || savingDelivery}
          >
            {savingDelivery ? 'Saving...' : 'Save Delivery Pricing'}
          </button>
        </div>
      </section>
    </>
  );
}
