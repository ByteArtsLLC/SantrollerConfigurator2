import {
  Accordion,
  ComboboxChevron,
  createTheme,
  Divider,
  Fieldset,
  Input,
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
    Input: Input.extend({
      styles: {
        wrapper: {
          '--input-bg': 'light-dark(var(--mantine-color-gray-0), rgba(0, 0, 0, 0.35))',
          '--input-bd': 'light-dark(var(--mantine-color-gray-4), rgba(255, 255, 255, 0.18))',
        },
        input: {
          transition: 'border-color 150ms ease, background-color 150ms ease',
        },
      },
    }),
    ComboboxChevron: ComboboxChevron.extend({
      styles: {
        chevron: {
          color: 'var(--mantine-color-bright)',
          opacity: 0.8,
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
      defaultProps: {
        variant: 'separated',
        radius: 'md',
      },
      styles: {
        item: {
          border: '1px solid var(--mantine-color-default-border)',
          overflow: 'hidden',
          backgroundColor: 'var(--mantine-color-default)',
        },
        control: {
          padding: '10px 14px',
          backgroundColor: 'var(--mantine-color-default-hover)',
        },
        panel: {
          borderTop: '1px solid var(--mantine-color-default-border)',
        },
        label: {
          color: 'var(--mantine-color-bright)',
          fontWeight: 600,
        },
        chevron: {
          color: 'var(--mantine-color-bright)',
        },
        content: {
          padding: '14px',
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
