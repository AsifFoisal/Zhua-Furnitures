export const DESIGN_STUDIO_FEATURE = {
  enabled: false,
  label: 'Coming Soon',
  message: 'Our Design Studio tools are being rebuilt with smarter previews, faster rendering, and new customization features.',
} as const;

// Live independently of the wider Design Studio rollout: the Curtain Customizer
// is the measurement calculator + quote enquiry flow and is ready for customers.
export const CURTAIN_CUSTOMIZER_FEATURE = {
  enabled: true,
} as const;

export const isCurtainCustomizerEnabled = (): boolean =>
  CURTAIN_CUSTOMIZER_FEATURE.enabled || DESIGN_STUDIO_FEATURE.enabled;
