import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApplicantAudit } from './ApplicantAudit';
import { preScreenService } from '@/services/preScreenService';
vi.mock('@/services/preScreenService', () => ({ preScreenService: { submit: vi.fn() } }));

beforeEach(() => { vi.clearAllMocks(); window.scrollTo = vi.fn(); });
function start() {
  render(<MemoryRouter><ApplicantAudit /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'For Applicants' }));
  fireEvent.click(screen.getByRole('button', { name: 'Check eligibility' }));
  fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Ashish' } });
}
it('shows sponsor details conditionally and clears them when sponsorship changes', () => {
  start();
  fireEvent.click(screen.getByLabelText('Yes'));
  const company = screen.getByLabelText(/name of the company/);
  fireEvent.change(company, { target: { value: 'Acme' } });
  expect(screen.getByLabelText(/Acme.*address/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('No'));
  expect(screen.queryByLabelText(/name of the company/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Yes'));
  expect(screen.getByLabelText(/name of the company/)).toHaveValue('');
});

it('collects both English scores required by the backend assessment', () => {
  start();
  fireEvent.click(screen.getByLabelText('Yes'));
  fireEvent.change(screen.getByLabelText(/name of the company/), { target: { value: 'Acme' } });
  fireEvent.change(screen.getByLabelText(/Acme.*address/), { target: { value: 'Sydney' } });
  fireEvent.change(screen.getByLabelText(/ABN/), { target: { value: '12345678901' } });
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  fireEvent.change(screen.getByLabelText(/salary for the role/), { target: { value: '$100,000 – $120,000' } });
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  fireEvent.change(screen.getByLabelText(/currently live/), { target: { value: 'Australia' } });
  fireEvent.click(screen.getByLabelText('Citizen'));
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  fireEvent.change(screen.getByLabelText(/passport/), { target: { value: 'Nepal' } });
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  fireEvent.click(screen.getByLabelText('No', { selector: 'input[name="english_study"]' }));
  fireEvent.click(screen.getByLabelText('Yes', { selector: 'input[name="english_tested"]' }));
  expect(screen.getByLabelText(/overall English test score/)).toBeInTheDocument();
  expect(screen.getByLabelText(/lowest score in any English test component/)).toBeInTheDocument();
});
it('routes an unsponsored applicant to referral and contact, then submits to the employer service', async () => {
  vi.mocked(preScreenService.submit).mockResolvedValue({ prospect_id: 'p1', human_ref: 'MP-1', statutory_eligible: false, client_fit: false, can_book: false, reasons: [], blockers: [], next_steps: [] });
  start();
  fireEvent.click(screen.getByLabelText('No'));
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  expect(screen.getByText('How did you hear about us?')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Google'));
  fireEvent.submit(screen.getByRole('button', { name: /Next/ }).closest('form')!);
  fireEvent.change(screen.getByLabelText(/email address/), { target: { value: 'ashish@example.com' } });
  fireEvent.click(screen.getByLabelText(/I agree that MigrationPath/));
  fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!);
  await waitFor(() => expect(screen.getByText('Submitted successfully')).toBeInTheDocument());
  expect(preScreenService.submit).toHaveBeenCalledWith(expect.objectContaining({ party: 'applicant', sponsoring_employer: undefined, contact: expect.objectContaining({ full_name: 'Ashish', email: 'ashish@example.com', consent_given: true }) }));
});

it('collects the business flow without a candidate and confirms lawyer follow-up', async () => {
  vi.mocked(preScreenService.submit).mockResolvedValue({ prospect_id: 'p2', human_ref: 'MP-2', statutory_eligible: false, client_fit: false, can_book: false, reasons: [], blockers: [], next_steps: [] });
  render(<MemoryRouter><ApplicantAudit /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'For Businesses' }));
  expect(screen.getByText('Check if the business is eligible for sponsorship and nomination')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Check eligibility' }));
  const advance = () => fireEvent.submit(screen.getByRole('button', { name: /Next|Submit/ }).closest('form')!);
  fireEvent.change(screen.getByLabelText(/name of the business/), { target: { value: 'Acme Pty Ltd' } });
  fireEvent.change(screen.getByLabelText(/ABN of the business/), { target: { value: '12345678901' } });
  fireEvent.change(screen.getByLabelText(/business address/), { target: { value: 'Sydney' } });
  fireEvent.click(screen.getByLabelText('No'));
  fireEvent.change(screen.getByLabelText(/first name/), { target: { value: 'Sam' } });
  advance();
  fireEvent.click(screen.getByLabelText('Yes'));
  expect(screen.getByText(/Standard Business Sponsor \(SBS\)/)).toBeInTheDocument();
  fireEvent.click(screen.getAllByLabelText('No')[0]);
  expect(screen.queryByText(/Standard Business Sponsor \(SBS\)/)).not.toBeInTheDocument();
  advance();
  fireEvent.click(screen.getByLabelText('No')); advance();
  expect(screen.getByLabelText(/annual revenue/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/annual revenue/), { target: { value: '$1M - $5M' } }); advance();
  fireEvent.change(screen.getByLabelText(/How long/), { target: { value: '3 - 4 years' } });
  fireEvent.click(screen.getByLabelText('No'));
  expect(screen.getByLabelText(/Where overseas/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Where overseas/), { target: { value: 'Nepal' } }); advance();
  fireEvent.change(screen.getByLabelText(/How many employees/), { target: { value: '5 - 10' } });
  fireEvent.click(screen.getByLabelText('No')); advance();
  fireEvent.click(screen.getByLabelText('Google')); advance();
  fireEvent.change(screen.getByLabelText(/best email/), { target: { value: 'sam@example.com' } });
  fireEvent.change(screen.getByLabelText(/contact number/), { target: { value: '+61412345678' } });
  expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/I agree that MigrationPath/)); advance();
  await waitFor(() => expect(screen.getByText('Submitted successfully')).toBeInTheDocument());
  expect(screen.getByText(/Our lawyers will review your details and contact you/)).toBeInTheDocument();
  expect(preScreenService.submit).toHaveBeenCalledWith(expect.objectContaining({ party: 'business', business: expect.objectContaining({ sponsor: expect.objectContaining({ legal_name: 'Acme Pty Ltd', years_trading: 3 }), nomination: undefined, candidate: undefined }) }));
});
