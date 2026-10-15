import {
  Accordion,
  createTheme,
  Divider,
  Fieldset,
  InputLabel,
  InputWrapper,
  Title,
} from '@mantine/core';

export const theme = createTheme({
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: 'calc(2.125rem * var(--mantine-scale))', lineHeight: '1.25' },
      h2: { fontSize: 'calc(1.625rem * var(--mantine-scale))', lineHeight: '1.3' },
      h3: { fontSize: 'calc(1.35rem * var(--mantine-scale))', lineHeight: '1.35' },
      h4: { fontSize: 'calc(1.15rem * var(--mantine-scale))', lineHeight: '1.4' },
      h5: { fontSize: 'calc(1rem * var(--mantine-scale))', lineHeight: '1.45' },
      h6: { fontSize: 'calc(0.875rem * var(--mantine-scale))', lineHeight: '1.5' },
    },
  },
  components: {
    Title: Title.extend({
      styles: {
        root: {
          color: 'var(--mantine-color-bright)',
          letterSpacing: '-0.012em',
        },
      },
    }),
    InputWrapper: InputWrapper.extend({
      styles: {
        label: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 600,
        },
      },
    }),
    InputLabel: InputLabel.extend({
      styles: {
        label: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 600,
        },
      },
    }),
    Accordion: Accordion.extend({
      styles: {
        label: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 600,
        },
      },
    }),
    Fieldset: Fieldset.extend({
      styles: {
        legend: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 700,
        },
      },
    }),
    Divider: Divider.extend({
      styles: {
        label: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 600,
        },
      },
    }),
  },
});
