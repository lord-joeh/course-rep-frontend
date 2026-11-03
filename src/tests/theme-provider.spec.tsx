import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/theme-provider';

function TestConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('renders default light theme and sets resolvedTheme to light', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches to dark theme and updates document.documentElement', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>,
    );

    const darkBtn = screen.getByText('Set Dark');
    act(() => {
      darkBtn.click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('cr_v2_theme')).toBe('dark');
  });
});
