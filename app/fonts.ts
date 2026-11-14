// Fuentes autoalojadas: los mismos ficheros woff2 que sirve el original (subconjunto latin),
// cargados con next/font/local. Las variables CSS se consumen en styles/tokens.css.
import localFont from 'next/font/local';


export const poppins = localFont({
  variable: '--ff-poppins',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
  src: [
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxibyp8kv8jhgfvrldz8z1xlfq.woff2', weight: '300', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxieyp8kv8jhgfvrjjfecg.woff2', weight: '400', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxigyp8kv8jhgfvrjjluchta.woff2', weight: '400', style: 'italic' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxibyp8kv8jhgfvrlgt9z1xlfq.woff2', weight: '500', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxidyp8kv8jhgfvrjjlmg1hvf9eo.woff2', weight: '500', style: 'italic' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxibyp8kv8jhgfvrlej6z1xlfq.woff2', weight: '600', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxibyp8kv8jhgfvrlcz7z1xlfq.woff2', weight: '700', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/poppins-pxibyp8kv8jhgfvrldd4z1xlfq.woff2', weight: '800', style: 'normal' },
  ],
});

export const chivo = localFont({
  variable: '--ff-chivo',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
  src: [
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/chivo-va9i4kzixd1kfrboqem.woff2', weight: '100 900', style: 'normal' },
    { path: '../public/wp-content/uploads/elementor/google-fonts/fonts/chivo-va9g4kzixd1kfrbtcefflq.woff2', weight: '100 900', style: 'italic' },
  ],
});

export const oswald = localFont({
  variable: '--ff-oswald',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
  src: [{ path: '../public/wp-content/uploads/elementor/google-fonts/fonts/oswald-tk3iwkuhhaijg752gt8g.woff2', weight: '200 700', style: 'normal' }],
});

export const montserrat = localFont({
  variable: '--ff-montserrat',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
  src: [{ path: '../public/fonts/gstatic/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aXp-p7K4KLg.woff2', weight: '600', style: 'normal' }],
});

// Fuente de iconos del tema (flechas y chevrons), mismo fichero que el original.
export const lqdIcons = localFont({
  variable: '--ff-lqd-icons',
  display: 'block',
  adjustFontFallback: false,
  src: [{ path: '../public/wp-content/themes/hub/assets/vendors/liquid-icon/lqd-essentials/fonts/lqd-essentials.woff2', weight: '400', style: 'normal' }],
});


// Space Grotesk: la usan la página 404 (capas RevSlider del original) y Academy (texto del Centro de Ayuda).
export const spaceGrotesk = localFont({
  variable: '--ff-space-grotesk',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
  src: [{ path: '../public/fonts/gstatic/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2', weight: '300 700', style: 'normal' }],
});

export const fontVariables = [poppins, chivo, oswald, montserrat, lqdIcons, spaceGrotesk].map(f => f.variable).join(' ');
