'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/data';
import {
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  type DeliveryZone,
} from '@/lib/delivery';
import { Check, ChevronRight, CreditCard, Truck, FileText } from 'lucide-react';
import styles from './page.module.css';

const steps = ['Delivery', 'Payment', 'Review'];

type DeliveryForm = { name: string; email: string; phone: string; address: string; city: string; province: string; postalCode: string; deliveryType: string; };

export default function CheckoutPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [deliveryData, setDeliveryData] = useState<DeliveryForm | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const { items, total } = useCartStore();
  const { register, handleSubmit, watch } = useForm<DeliveryForm>();
  const selectedProvince = watch('province');
  const deliveryArea = deliveryZones.find((zone) => zone.id === selectedProvince);
  const deliveryType = watch('deliveryType') || 'standard';
  const cartTotal = total();
  const deliveryFee = deliveryArea
    ? deliveryType === 'express'
      ? deliveryArea.expressFee
      : cartTotal >= freeShippingThreshold
        ? 0
        : deliveryArea.standardFee
    : 0;
  const grandTotal = cartTotal - promoDiscount + deliveryFee;
  const hydratedItems = isHydrated ? items : [];
  const hydratedCartTotal = isHydrated ? cartTotal : 0;
  const hydratedPromoDiscount = isHydrated ? promoDiscount : 0;
  const hydratedDeliveryFee = isHydrated ? deliveryFee : 0;
  const hydratedGrandTotal = isHydrated ? grandTotal : 0;
  const paymentOptions = [
    {
      id: 'payfast',
      label: 'PayFast',
      desc: 'Secure payment via PayFast',
      sub: 'Visa, Mastercard, EFT',
      enabled: true,
    },
    {
      id: 'yoco',
      label: 'Yoco',
      desc: 'Pay with Yoco card gateway',
      sub: 'Coming soon',
      enabled: false,
    },
    {
      id: 'payflex',
      label: 'Payflex (BNPL)',
      desc: 'Buy now, pay in 4 instalments',
      sub: 'Coming soon',
      enabled: false,
    },
  ] as const;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('promo');
    if (code) {
      setPromoCode(code.trim().toUpperCase());
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadDeliveryConfig = async () => {
      try {
        const res = await fetch('/api/delivery-config');
        const data = (await res.json()) as {
          delivery?: { freeShippingThreshold: number; zones: DeliveryZone[] };
        };

        if (
          ignore ||
          !res.ok ||
          !data.delivery ||
          !Array.isArray(data.delivery.zones) ||
          data.delivery.zones.length === 0
        ) {
          return;
        }

        setDeliveryZones(data.delivery.zones);
        setFreeShippingThreshold(Number(data.delivery.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD));
      } catch {
        // Keep sensible defaults when the delivery config endpoint is unavailable.
      }
    };

    void loadDeliveryConfig();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!promoCode || cartTotal <= 0) {
      setPromoDiscount(0);
      return;
    }

    let ignore = false;

    const validatePromo = async () => {
      setPromoLoading(true);

      try {
        const res = await fetch('/api/promos/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode, subtotal: cartTotal }),
        });

        const data = (await res.json()) as {
          valid?: boolean;
          promo?: { discountCents: number };
        };

        if (ignore) {
          return;
        }

        if (!res.ok || !data.valid || !data.promo) {
          setPromoDiscount(0);
          return;
        }

        setPromoDiscount(data.promo.discountCents / 100);
      } finally {
        if (!ignore) {
          setPromoLoading(false);
        }
      }
    };

    void validatePromo();

    return () => {
      ignore = true;
    };
  }, [promoCode, cartTotal]);

  const onDeliverySubmit = (data: DeliveryForm) => {
    setDeliveryData(data);
    setSubmitError('');
    setStep(1);
    toast.success('Delivery details saved.');
  };

  const placeOrder = async () => {
    if (paymentMethod !== 'payfast') {
      const message = 'This payment method is not available yet. Please use PayFast for now.';
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (!deliveryData) {
      const message = 'Please complete delivery details first.';
      setSubmitError(message);
      toast.error(message);
      setStep(0);
      return;
    }

    if (items.length === 0) {
      const message = 'Your cart is empty.';
      setSubmitError(message);
      toast.error(message);
      return;
    }

    setPlacingOrder(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery: {
            ...deliveryData,
            deliveryType,
          },
          paymentMethod,
          deliveryFee,
          total: grandTotal,
          promoCode: promoDiscount > 0 ? promoCode : undefined,
          items: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            selectedFabric: item.selectedFabric,
            customNote: item.customNote,
          })),
        }),
      });

      const data = (await res.json()) as { orderId?: string; orderNumber?: string; error?: string };
      if (!res.ok || !data.orderNumber || !data.orderId) {
        throw new Error(data.error ?? 'Could not place order.');
      }

      const paymentInitRes = await fetch('/api/payments/payfast/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      });

      const paymentInit = (await paymentInitRes.json()) as {
        redirectUrl?: string;
        formAction?: string;
        fields?: Record<string, string>;
        error?: string;
      };

      if (!paymentInitRes.ok || !paymentInit.formAction || !paymentInit.fields) {
        throw new Error(paymentInit.error ?? 'Could not initialize PayFast checkout.');
      }

      // The cart is deliberately kept until the customer is back on the
      // confirmation page. If the gateway page fails (for example a PayFast
      // 500), the customer can press back and retry without re-adding items.
      toast.info('Redirecting to PayFast...');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentInit.formAction;

      for (const [key, value] of Object.entries(paymentInit.fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not place order.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/cart" className={styles.back}>← Back to Cart</Link>
        <h1 className={styles.title}>Checkout</h1>

        {/* Stepper */}
        <div className={styles.stepper}>
          {steps.map((s, i) => (
            <div key={s} className={styles.stepWrap}>
              <div className={styles.stepItem}>
                <div className={`${styles.stepCircle} ${i < step ? styles.done : i === step ? styles.active : styles.pending}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Left Panel */}
          <div className={styles.left}>
            {/* Step 0: Delivery */}
            {step === 0 && (
              <form onSubmit={handleSubmit(onDeliverySubmit)} className={styles.formSection}>
                <div className={styles.sectionHeader}><Truck size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Delivery Information</h2></div>
                <div className={styles.formGrid2}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" {...register('name', { required: true })} placeholder="Your full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" {...register('email', { required: true })} placeholder="your@email.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" {...register('phone', { required: true })} placeholder="+27 000 000 0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input className="form-input" {...register('address', { required: true })} placeholder="123 Main Street" />
                </div>
                <div className={styles.formGrid2}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" {...register('city', { required: true })} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <select className="form-select" {...register('province', { required: true })}>
                      <option value="">Select Province</option>
                      {deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input className="form-input" {...register('postalCode', { required: true })} placeholder="0000" />
                </div>

                {deliveryArea && (
                  <div className={styles.deliveryOptions}>
                    <h3 className={styles.optionsTitle}>Delivery Method</h3>
                    <div className={styles.deliveryOptGrid}>
                      {[
                        { id: 'standard', label: 'Standard Delivery', days: deliveryArea.standardDays, fee: deliveryArea.standardFee },
                        { id: 'express', label: 'Express Delivery', days: deliveryArea.expressDays, fee: deliveryArea.expressFee },
                      ].map(opt => (
                        <label key={opt.id} className={`${styles.deliveryOpt} ${deliveryType === opt.id ? styles.deliveryOptActive : ''}`}>
                          <input type="radio" value={opt.id} {...register('deliveryType')} defaultChecked={opt.id === 'standard'} className={styles.radioHidden} />
                          <div>
                            <div className={styles.optLabel}>{opt.label}</div>
                            <div className={styles.optDays}>{opt.days} business days</div>
                          </div>
                          <div className={styles.optFee}>
                            {opt.fee === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(opt.fee)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  Continue to Payment <ChevronRight size={18} />
                </button>
              </form>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}><CreditCard size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Payment Method</h2></div>
                <div className={styles.paymentMethods}>
                  {paymentOptions.map((pm) => (
                    <label
                      key={pm.id}
                      className={`${styles.paymentOpt} ${paymentMethod === pm.id ? styles.paymentOptActive : ''}`}
                      style={pm.enabled ? undefined : { opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => {
                          if (pm.enabled) {
                            setPaymentMethod(pm.id);
                          }
                        }}
                        disabled={!pm.enabled}
                        className={styles.radioHidden}
                      />
                      <div className={styles.paymentOptLeft}>
                        <div className={styles.paymentLabel}>{pm.label}</div>
                        <div className={styles.paymentDesc}>{pm.desc}</div>
                        <div className={styles.paymentSub}>{pm.sub}</div>
                      </div>
                      {paymentMethod === pm.id && <Check size={16} color="#B59241" />}
                    </label>
                  ))}
                </div>

                {paymentMethod === 'payflex' && (
                  <div className={styles.payflex}>
                    <p className={styles.payflexTitle}>Pay {formatPrice(hydratedGrandTotal / 4)} today, then 3 x {formatPrice(hydratedGrandTotal / 4)} over 6 weeks</p>
                    <p className={styles.payflexNote}>Interest-free. No hidden fees. Approval is instant.</p>
                  </div>
                )}

                <div className={styles.stepBtns}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}><FileText size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Review Your Order</h2></div>
                <div className={styles.reviewItems}>
                  {hydratedItems.map(item => (
                    <div key={item.product.id} className={styles.reviewItem}>
                      <span className={styles.reviewName}>{item.product.name} × {item.quantity}</span>
                      <span className={styles.reviewPrice}>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {hydratedPromoDiscount > 0 ? (
                  <div className={styles.reviewTotal}>
                    <span>Promo ({promoCode})</span><span>-{formatPrice(hydratedPromoDiscount)}</span>
                  </div>
                ) : null}
                <div className={styles.reviewTotal}>
                  <span>Delivery</span><span>{hydratedDeliveryFee === 0 ? 'FREE' : formatPrice(hydratedDeliveryFee)}</span>
                </div>
                <div className={`${styles.reviewTotal} ${styles.reviewGrand}`}>
                  <span>Total</span><span>{formatPrice(hydratedGrandTotal)}</span>
                </div>
                <div className={styles.stepBtns}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={placeOrder}
                    disabled={placingOrder}
                  >
                    Place Order → Pay with {paymentMethod === 'payfast' ? 'PayFast' : paymentMethod === 'yoco' ? 'Yoco' : 'Payflex'}
                  </button>
                </div>
                {submitError ? <p style={{ marginTop: '0.8rem', color: '#ffd0d0' }}>{submitError}</p> : null}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            {hydratedItems.map(item => (
              <div key={item.product.id} className={styles.summaryItem}>
                <span className={styles.summaryItemName}>{item.product.name} × {item.quantity}</span>
                <span className={styles.summaryItemPrice}>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(hydratedCartTotal)}</span></div>
            {hydratedPromoDiscount > 0 ? (
              <div className={styles.summaryRow}><span>Promo ({promoCode})</span><span>-{formatPrice(hydratedPromoDiscount)}</span></div>
            ) : null}
            <div className={styles.summaryRow}><span>Delivery</span><span>{hydratedDeliveryFee === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(hydratedDeliveryFee)}</span></div>
            <div className={`${styles.summaryRow} ${styles.summaryGrand}`}><span>Total</span><span>{formatPrice(hydratedGrandTotal)}</span></div>
            {promoLoading ? <p style={{ color: '#7b8ea6', marginTop: '0.6rem' }}>Validating promo...</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
