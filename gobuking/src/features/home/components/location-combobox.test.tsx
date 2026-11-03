import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationCombobox } from './location-combobox';
describe('LocationCombobox', () => {
  it('selects a typed ID with keyboard and clears that ID when text changes', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <LocationCombobox
        id="destination"
        label="Destinasi"
        value=""
        onChange={change}
      />,
    );
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'Bali');
    await screen.findByRole('option', { name: /Bali Destinasi/ });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(change).toHaveBeenLastCalledWith('bali');
    expect(input).toHaveValue('Bali');
    await user.type(input, 'x');
    expect(change).toHaveBeenLastCalledWith('');
    expect(input).toHaveValue('Balix');
  });
  it('closes suggestions with Escape', async () => {
    const user = userEvent.setup();
    render(
      <LocationCombobox
        id="airport"
        label="Dari"
        value=""
        onChange={() => {}}
        airport
      />,
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
