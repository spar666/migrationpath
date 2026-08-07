import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const searchOccupations = vi.fn();
vi.mock('@/services/occupationService', () => ({
  occupationService: {
    searchOccupations: (...args: unknown[]) => searchOccupations(...args),
  },
}));

const { OccupationSearchField } = await import('./OccupationSearchField');

/**
 * The nominated occupation decides the whole employer-sponsored verdict, and it
 * is decided by ANZSCO code. This component's job is to make sure the code that
 * reaches the engine came from the catalogue rather than from a job title
 * somebody typed — so these tests are mostly about what it refuses to emit.
 */

function setup(value = '') {
  const onSelect = vi.fn();
  const onClear = vi.fn();
  render(
    <OccupationSearchField
      id="occupation_name"
      value={value}
      onSelect={onSelect}
      onClear={onClear}
    />,
  );
  return { onSelect, onClear };
}

function type(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
}

const ROWS = {
  data: [
    {
      anzsco_code: '261313',
      occupation_name: 'Software Engineer',
      primary_list: 'CSOL',
    },
  ],
};

describe('OccupationSearchField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchOccupations.mockResolvedValue(ROWS);
  });

  it('does not query on a single character', async () => {
    // One letter matches most of the catalogue; querying it wastes a round trip
    // and floods the list with noise.
    setup();
    type('S');
    await new Promise((r) => setTimeout(r, 350));
    expect(searchOccupations).not.toHaveBeenCalled();
  });

  it('emits the catalogue code, not the typed text, on selection', async () => {
    const { onSelect } = setup();
    type('Softw');

    fireEvent.click(await screen.findByText('Software Engineer'));

    expect(onSelect).toHaveBeenCalledWith({
      anzsco_code: '261313',
      occupation_name: 'Software Engineer',
      primary_list: 'CSOL',
    });
  });

  it('shows the ANZSCO code alongside each result', async () => {
    // Two occupations can share a plausible title; the code is what
    // disambiguates them, so it has to be visible before choosing.
    setup();
    type('Softw');
    expect(await screen.findByText('ANZSCO 261313')).toBeInTheDocument();
  });

  it('tells the user to keep going when the search fails', async () => {
    // A dead occupation lookup must not read as "your occupation is ineligible".
    searchOccupations.mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setup();
    type('Softw');

    await waitFor(() =>
      expect(screen.getByText(/an agent will confirm/i)).toBeInTheDocument(),
    );
  });

  it('renders a chosen occupation as a confirmed selection, not an input', () => {
    setup('Software Engineer');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('clears the resolved code when the selection is removed', () => {
    const { onClear } = setup('Software Engineer');
    fireEvent.click(
      screen.getByRole('button', { name: /change occupation/i }),
    );
    expect(onClear).toHaveBeenCalled();
  });
});
