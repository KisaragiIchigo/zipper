import type { Config } from 'tailwindcss'

/**
 * 色は globals.css の CSS 変数を単一情報源とする。
 * ソリッド色は "R G B" 成分で持ち alpha modifier（bg-accent/10）に対応させ、
 * 半透明が仕様として確定している面（surface / border）は完成形の rgba を直接参照する。
 */
const solid = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: solid('bg'),
        'bg-alt': solid('bg-alt'),
        'surface-solid': solid('surface-solid'),
        accent: solid('accent'),
        'accent-hover': solid('accent-hover'),
        'accent-pressed': solid('accent-pressed'),
        danger: solid('danger'),
        'danger-text': solid('danger-text'),
        warning: solid('warning'),
        'warning-text': solid('warning-text'),
        success: solid('success'),
        'success-text': solid('success-text'),
        primary: solid('text-primary'),
        secondary: solid('text-secondary'),
        muted: solid('text-disabled'),
        surface: 'var(--surface)',
        'surface-deep': 'var(--surface-deep)',
        'subtle-hover': 'var(--subtle-hover)',
        'subtle-pressed': 'var(--subtle-pressed)',
        line: 'var(--border)',
        'line-subtle': 'var(--border-subtle)'
      },
      borderColor: {
        DEFAULT: 'var(--border)'
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ["'IBM Plex Sans JP'", 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace']
      },
      fontSize: {
        // ウィンドウ幅に滑らかに追従させる。下限は可読性の床として 12px を割らない。
        fluid: ['clamp(0.75rem, 0.71rem + 0.18vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-lg': ['clamp(0.875rem, 0.82rem + 0.25vw, 1rem)', { lineHeight: '1.45' }]
      },
      borderRadius: {
        DEFAULT: '4px',
        control: '4px',
        card: '7px',
        overlay: '8px'
      },
      height: {
        row: '32px',
        'row-compact': '28px',
        titlebar: '40px',
        commandbar: '44px'
      },
      boxShadow: {
        flyout: '0 8px 16px rgba(0,0,0,0.14)',
        dialog: '0 32px 64px rgba(0,0,0,0.19)',
        // Fluent の TextControlElevation。入力欄の下端だけを 1px 強調する
        control: 'inset 0 -1px 0 0 var(--control-underline)',
        'control-focus': 'inset 0 -2px 0 0 rgb(var(--accent))'
      },
      transitionTimingFunction: {
        fluent: 'cubic-bezier(0, 0, 0, 1)',
        'fluent-exit': 'cubic-bezier(1, 0, 1, 1)'
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms'
      },
      backdropBlur: {
        acrylic: '30px'
      }
    }
  },
  plugins: []
} satisfies Config
