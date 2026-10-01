'use client';
import styles from './HowItWorks.module.css';
import { MessageCircle, Palette, Hammer, Truck } from 'lucide-react';

const steps = [
  { icon: MessageCircle, number: '01', title: 'Tell Us Your Vision', desc: 'Send us your requirements, photos or measurements.', color: '#B59241' },
  { icon: Palette, number: '02', title: 'Choose Your Design', desc: 'Select furniture, fabric, finishes and materials.', color: '#4ECDC4' },
  { icon: Hammer, number: '03', title: 'We Make It', desc: 'Our team manufactures and customises your pieces.', color: '#B39DDB' },
  { icon: Truck, number: '04', title: 'We Deliver & Install', desc: 'We bring everything together in your space.', color: '#FF8A65' },
];

export default function HowItWorks() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <span className="label-accent">How ZHUA Works</span>
          <div className="gold-divider" style={{ margin: '0.75rem auto 1rem' }} />
          <h2 className="heading-xl">From Idea to Installation</h2>
        </div>

        <div className={styles.grid}>
          {steps.map((step, i) => (
            <div key={step.number} className={styles.step}>
              <div className={styles.stepNumber} style={{ color: step.color + '30' }}>{step.number}</div>
              <div className={styles.iconWrap} style={{ background: step.color + '12', border: `1px solid ${step.color}25` }}>
                <step.icon size={26} color={step.color} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
              {i < steps.length - 1 && <div className={styles.connector} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
