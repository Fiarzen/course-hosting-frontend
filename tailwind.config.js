/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Shippori Mincho"', '"Cormorant Garamond"', 'serif'],
        mono:  ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Use CSS variables so dark mode flips automatically.
        paper:     'var(--paper)',
        'paper-2': 'var(--paper-2)',
        ink:       'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        moss:      'var(--moss)',
        'moss-deep': 'var(--moss-deep)',
        'moss-soft': 'var(--moss-soft)',
        'moss-wash': 'var(--moss-wash)',
        gold:      'var(--gold)',
      },
      borderColor: {
        hair:          'var(--hair)',
        'hair-strong': 'var(--hair-strong)',
      },
      letterSpacing: {
        kicker: '0.18em',
        tight2: '-0.018em',
      },
      maxWidth: {
        page: '1180px',
      },
    },
  },
  plugins: [],
};
