/**
 * Example Component Test
 *
 * This is an example test demonstrating how to use the test utilities.
 * You can use this as a template for your own component tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This is a placeholder example - replace with your actual component
function ExampleButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>;
}

describe('ExampleButton', () => {
  it('renders children correctly', () => {
    render(<ExampleButton>Click me</ExampleButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<ExampleButton onClick={handleClick}>Click me</ExampleButton>);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible', () => {
    render(<ExampleButton>Accessible Button</ExampleButton>);

    const button = screen.getByRole('button', { name: 'Accessible Button' });
    expect(button).toBeInTheDocument();
  });
});

// Example test using custom render helper
describe('ExampleButton with providers', () => {
  it('renders with React Query provider', () => {
    // If your component needs React Query, use renderWithProviders
    // import { renderWithProviders } from '@/tests/utils';
    // const { getByText } = renderWithProviders(<ExampleButton>Test</ExampleButton>);
    // expect(getByText('Test')).toBeInTheDocument();
  });
});
