import Link from 'next/link';
import styles from './ComingSoonPanel.module.css';

interface ComingSoonPanelProps {
  label?: string;
  title: string;
  message: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export default function ComingSoonPanel({
  label = 'Coming Soon',
  title,
  message,
  primaryCta = { label: 'Shop Collection', href: '/shop' },
  secondaryCta,
}: ComingSoonPanelProps) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.panel}>
          <span className={styles.badge}>{label}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.message}>{message}</p>
          <div className={styles.actions}>
            <Link href={primaryCta.href} className="btn btn-primary btn-lg">
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link href={secondaryCta.href} className="btn btn-outline btn-lg">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
