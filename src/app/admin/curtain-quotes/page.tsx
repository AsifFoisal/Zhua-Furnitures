'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useToastFeedback } from '@/lib/toast-feedback';
import { formatPrice } from '@/lib/data';
import styles from '../admin-pages.module.css';

type QuoteConfig = {
  widthCm?: number;
  dropCm?: number;
  windows?: number;
  panelsPerWindow?: number;
  heading?: string;
  fabric?: string;
  colour?: string;
  layers?: string;
  lining?: string;
  trackType?: string;
  trackCount?: string;
  motorised?: boolean;
  installation?: string;
  totalFabricMetres?: number;
  estimateTotal?: number;
};

type FinalLineItem = { label: string; amount: number };

interface CurtainQuoteRow {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  configuration: QuoteConfig | null;
  estimatedTotal: number;
  status: 'new' | 'reviewing' | 'quoted' | 'won' | 'lost' | 'archived';
  finalTotal: number | null;
  finalLineItems: FinalLineItem[] | null;
  quoteMessage: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentProvider: string;
  paymentReference: string;
  quoteSentAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

const statusOptions: CurtainQuoteRow['status'][] = ['new', 'reviewing', 'quoted', 'won', 'lost', 'archived'];

const numberFromInput = (value: string): number => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

function describeConfiguration(config: QuoteConfig | null): string {
  if (!config) return '-';
  return [
    `${config.widthCm ?? '?'}cm × ${config.dropCm ?? '?'}cm`,
    `${config.windows ?? 1} window(s) · ${config.panelsPerWindow ?? 2} panel(s)`,
    config.heading,
    config.fabric,
    config.colour,
    config.layers,
    config.lining,
    config.trackType,
    config.trackCount,
    config.motorised ? 'Motorised' : null,
    config.installation,
  ]
    .filter(Boolean)
    .join(' · ');
}

function configurationDetails(config: QuoteConfig | null): { label: string; value: string }[] {
  if (!config) return [];
  return [
    { label: 'Window width', value: `${config.widthCm ?? '-'} cm` },
    { label: 'Drop / height', value: `${config.dropCm ?? '-'} cm` },
    { label: 'Windows', value: String(config.windows ?? 1) },
    { label: 'Panels per window', value: String(config.panelsPerWindow ?? 2) },
    { label: 'Heading style', value: config.heading ?? '-' },
    { label: 'Fabric', value: config.fabric ?? '-' },
    { label: 'Colour', value: config.colour ?? '-' },
    { label: 'Layers', value: config.layers ?? '-' },
    { label: 'Lining', value: config.lining ?? '-' },
    { label: 'Track / rod', value: config.trackType ?? '-' },
    { label: 'Track setup', value: config.trackCount ?? '-' },
    { label: 'Motorised', value: config.motorised ? 'Yes' : 'No' },
    { label: 'Installation', value: config.installation ?? '-' },
    { label: 'Est. fabric required', value: `${config.totalFabricMetres ?? '-'} m` },
  ];
}

type Draft = {
  finalTotal: string;
  lines: FinalLineItem[];
  quoteMessage: string;
};

export default function CurtainQuotesAdminPage() {
  const [quotes, setQuotes] = useState<CurtainQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sending, setSending] = useState(false);
  const [sentLinks, setSentLinks] = useState<Record<string, string>>({});

  useToastFeedback({ error });

  const loadQuotes = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/curtain-quotes', { cache: 'no-store' });
      const data = (await res.json()) as { quotes?: CurtainQuoteRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load curtain quotes.');
      }

      setQuotes(data.quotes ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load curtain quotes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuotes();
  }, []);

  const toggleEditor = (row: CurtainQuoteRow) => {
    if (expandedId === row.id) {
      setExpandedId(null);
      setDraft(null);
      return;
    }

    setExpandedId(row.id);
    setDraft({
      finalTotal: row.finalTotal !== null ? String(row.finalTotal) : '',
      lines: row.finalLineItems ?? [],
      quoteMessage: row.quoteMessage ?? '',
    });
  };

  const patchDraft = (patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const setLines = (lines: FinalLineItem[]) => {
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    setDraft((current) => (current ? { ...current, lines, finalTotal: String(total || '') } : current));
  };

  const saveStatus = async (row: CurtainQuoteRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/curtain-quotes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status }),
      });

      const data = (await res.json()) as { quote?: { status: CurtainQuoteRow['status'] }; error?: string };
      if (!res.ok || !data.quote) {
        throw new Error(data.error ?? 'Could not update quote.');
      }

      setQuotes((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, status: data.quote!.status } : item))
      );
      toast.success('Quote updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update quote.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const savePricing = async (row: CurtainQuoteRow) => {
    if (!draft) return;

    const finalTotal = numberFromInput(draft.finalTotal);
    if (finalTotal <= 0) {
      toast.error('Enter a final total greater than zero.');
      return;
    }

    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/curtain-quotes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalTotal,
          finalLineItems: draft.lines,
          quoteMessage: draft.quoteMessage,
        }),
      });

      const data = (await res.json()) as { quote?: Partial<CurtainQuoteRow>; error?: string };
      if (!res.ok || !data.quote) {
        throw new Error(data.error ?? 'Could not save the final pricing.');
      }

      setQuotes((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...data.quote } : item)));
      toast.success('Final pricing saved. Ready to send to the customer.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the final pricing.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const sendQuote = async (row: CurtainQuoteRow) => {
    if (!window.confirm(`Send the final quotation (${formatPrice(row.finalTotal ?? 0)}) to ${row.email}?`)) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/curtain-quotes/${row.id}/send`, { method: 'POST' });
      const data = (await res.json()) as { success?: boolean; paymentUrl?: string; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Could not send the quotation.');
      }

      if (data.paymentUrl) {
        setSentLinks((prev) => ({ ...prev, [row.id]: data.paymentUrl! }));
      }

      setQuotes((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, status: item.status === 'won' ? item.status : 'quoted', quoteSentAt: new Date().toISOString() }
            : item
        )
      );
      toast.success(`Quotation emailed to ${row.email}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send the quotation.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (row: CurtainQuoteRow) => {
    const link = sentLinks[row.id];
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Payment link copied.');
    } catch {
      toast.error('Could not copy the link — copy it manually from the field.');
    }
  };

  const draftLinesTotal = draft ? draft.lines.reduce((sum, line) => sum + line.amount, 0) : 0;

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Curtain Quote Enquiries</h2>
      <p style={{ color: '#a9b7c9', marginBottom: '1rem' }}>
        Review each configuration, adjust the final pricing, and email the quotation to the customer. The email
        includes a secure payment link for the confirmed amount. Quotes must be saved with a final total before
        they can be sent.
      </p>
      {loading ? <p style={{ color: '#a9b7c9' }}>Loading quotes...</p> : null}
      {error ? <p style={{ color: '#ffd0d0' }}>{error}</p> : null}
      {!loading && quotes.length === 0 ? <p style={{ color: '#a9b7c9' }}>No curtain quote enquiries yet.</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Email</th>
              <th>Estimate</th>
              <th>Final</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((row) => (
              <QuoteRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                draft={draft}
                savingId={savingId}
                sending={sending}
                sentLink={sentLinks[row.id]}
                draftLinesTotal={draftLinesTotal}
                onToggle={() => toggleEditor(row)}
                onStatusChange={(status) =>
                  setQuotes((prev) =>
                    prev.map((item) => (item.id === row.id ? { ...item, status } : item))
                  )
                }
                onSaveStatus={() => void saveStatus(row)}
                onPatchDraft={patchDraft}
                onSetLines={setLines}
                onSavePricing={() => void savePricing(row)}
                onSend={() => void sendQuote(row)}
                onCopyLink={() => void copyLink(row)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type QuoteRowProps = {
  row: CurtainQuoteRow;
  expanded: boolean;
  draft: Draft | null;
  savingId: string | null;
  sending: boolean;
  sentLink?: string;
  draftLinesTotal: number;
  onToggle: () => void;
  onStatusChange: (status: CurtainQuoteRow['status']) => void;
  onSaveStatus: () => void;
  onPatchDraft: (patch: Partial<Draft>) => void;
  onSetLines: (lines: FinalLineItem[]) => void;
  onSavePricing: () => void;
  onSend: () => void;
  onCopyLink: () => void;
};

function QuoteRow({
  row,
  expanded,
  draft,
  savingId,
  sending,
  sentLink,
  draftLinesTotal,
  onToggle,
  onStatusChange,
  onSaveStatus,
  onPatchDraft,
  onSetLines,
  onSavePricing,
  onSend,
  onCopyLink,
}: QuoteRowProps) {
  const canSend = (row.finalTotal ?? 0) > 0 && row.paymentStatus !== 'paid';

  return (
    <>
      <tr>
        <td style={{ whiteSpace: 'nowrap' }}>
          {row.reference}
          {row.city ? <div style={{ color: '#8ca0b8', fontSize: 12 }}>{row.city}</div> : null}
        </td>
        <td>
          {row.fullName}
          <div style={{ color: '#8ca0b8', fontSize: 12 }}>{row.email}</div>
          {row.phone ? <div style={{ color: '#8ca0b8', fontSize: 12 }}>{row.phone}</div> : null}
        </td>
        <td style={{ whiteSpace: 'nowrap' }}>{formatPrice(row.estimatedTotal)}</td>
        <td style={{ whiteSpace: 'nowrap' }}>
          {row.finalTotal !== null ? formatPrice(row.finalTotal) : <span style={{ color: '#8ca0b8' }}>—</span>}
        </td>
        <td>
          {row.paymentStatus === 'paid' ? (
            <span style={{ color: '#3fbf7f' }}>
              Paid{row.paymentProvider ? ` (${row.paymentProvider.toUpperCase()})` : ''}
              {row.paidAt ? ` · ${row.paidAt.slice(0, 10)}` : ''}
            </span>
          ) : row.quoteSentAt ? (
            <span style={{ color: '#b59241' }}>Quote sent · awaiting payment</span>
          ) : (
            <span style={{ color: '#8ca0b8' }}>Not sent</span>
          )}
        </td>
        <td>
          <select
            className={styles.select}
            value={row.status}
            onChange={(event) => onStatusChange(event.target.value as CurtainQuoteRow['status'])}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </td>
        <td>{row.createdAt.slice(0, 10)}</td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <button className={styles.ghostButton} type="button" onClick={onToggle}>
            {expanded ? 'Close' : 'Review / Quote'}
          </button>{' '}
          <button className={styles.ghostButton} disabled={savingId === row.id} type="button" onClick={onSaveStatus}>
            {savingId === row.id ? 'Saving...' : 'Save Status'}
          </button>
        </td>
      </tr>

      {expanded ? (
        <tr>
          <td colSpan={8}>
            <div style={{ display: 'grid', gap: '1.25rem', padding: '0.5rem 0.25rem' }}>
              {/* Original configuration */}
              <div>
                <strong style={{ color: '#eaf0f8', fontSize: 13 }}>Customer configuration</strong>
                <p style={{ color: '#a9b7c9', fontSize: 13, margin: '0.35rem 0' }}>
                  {describeConfiguration(row.configuration)}
                </p>
                <details>
                  <summary style={{ cursor: 'pointer', color: '#b59241', fontSize: 12 }}>Full specification</summary>
                  <div style={{ marginTop: 6 }}>
                    {configurationDetails(row.configuration).map((detail) => (
                      <div key={detail.label} style={{ fontSize: 12, color: '#a9b7c9' }}>
                        <strong style={{ color: '#eaf0f8' }}>{detail.label}:</strong> {detail.value}
                      </div>
                    ))}
                  </div>
                </details>
                {row.notes ? (
                  <p style={{ color: '#8ca0b8', fontSize: 12, marginTop: 6 }}>Customer notes: {row.notes}</p>
                ) : null}
              </div>

              {/* Final pricing editor */}
              {draft ? (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                  <strong style={{ color: '#eaf0f8', fontSize: 13 }}>Final quotation</strong>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {draft.lines.map((line, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          className={styles.input}
                          value={line.label}
                          placeholder="Line item description"
                          onChange={(e) =>
                            onSetLines(
                              draft.lines.map((item, i) =>
                                i === index ? { ...item, label: e.target.value } : item
                              )
                            )
                          }
                        />
                        <input
                          className={styles.input}
                          type="number"
                          min={0}
                          value={line.amount}
                          onChange={(e) =>
                            onSetLines(
                              draft.lines.map((item, i) =>
                                i === index ? { ...item, amount: numberFromInput(e.target.value) } : item
                              )
                            )
                          }
                        />
                        <button
                          className={styles.ghostButton}
                          type="button"
                          aria-label="Remove line item"
                          style={{ color: '#ff8a8a', justifyContent: 'center' }}
                          onClick={() => onSetLines(draft.lines.filter((_, i) => i !== index))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        onClick={() => onSetLines([...draft.lines, { label: '', amount: 0 }])}
                      >
                        <Plus size={14} /> Add Line Item
                      </button>
                      {draft.lines.length === 0 && row.estimatedTotal > 0 ? (
                        <button
                          className={styles.ghostButton}
                          type="button"
                          onClick={() =>
                            onSetLines([
                              {
                                label: `Curtain supply & fitting (estimate was ${formatPrice(row.estimatedTotal)})`,
                                amount: row.estimatedTotal,
                              },
                            ])
                          }
                        >
                          <Plus size={14} /> Start from Estimate
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label className={styles.label} htmlFor={`final-total-${row.id}`}>Final total (R)</label>
                      <input
                        id={`final-total-${row.id}`}
                        className={styles.input}
                        type="number"
                        min={0}
                        value={draft.finalTotal}
                        onChange={(e) => onPatchDraft({ finalTotal: e.target.value })}
                      />
                      {draft.lines.length > 0 ? (
                        <span style={{ color: '#8ca0b8', fontSize: 11 }}>
                          Line items add up to {formatPrice(draftLinesTotal)}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label className={styles.label} htmlFor={`quote-message-${row.id}`}>
                        Message to customer (included in the email)
                      </label>
                      <textarea
                        id={`quote-message-${row.id}`}
                        className={styles.textarea}
                        rows={2}
                        value={draft.quoteMessage}
                        placeholder="e.g. Measurements confirmed for your windows. Lead time is 2–3 weeks from payment."
                        onChange={(e) => onPatchDraft({ quoteMessage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className={styles.ghostButton}
                      type="button"
                      disabled={savingId === row.id}
                      onClick={onSavePricing}
                    >
                      <Save size={14} /> {savingId === row.id ? 'Saving...' : 'Save Pricing'}
                    </button>
                    <button
                      className={styles.ghostButton}
                      type="button"
                      disabled={sending || !canSend}
                      title={canSend ? 'Email the quotation to the customer' : 'Save a final total first (paid quotes cannot be re-sent)'}
                      onClick={onSend}
                    >
                      <Send size={14} /> {sending ? 'Sending...' : 'Send Quote to Customer'}
                    </button>
                  </div>

                  {sentLink ? (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <span style={{ color: '#8ca0b8', fontSize: 11 }}>Payment link sent to the customer:</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input className={styles.input} readOnly value={sentLink} onFocus={(e) => e.target.select()} />
                        <button className={styles.ghostButton} type="button" onClick={onCopyLink} style={{ justifyContent: 'center' }}>
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
