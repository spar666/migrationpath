import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/common/navbar/Header';
import { Footer } from '@/components/common/footer/Footer';
import { MobileBottomNav } from '@/components/common/navbar/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { prospectService } from '@/services/prospectService';
import { getErrorMessage } from '@/lib/errorHandler';

const CONSENT_TEXT =
  'I consent to MigrationPath collecting these details to respond to my enquiry and discuss migration services.';

interface StandardCaptureProps {
  pathway: '485' | '858';
  title: string;
  description: string;
}

export default function StandardCapture({
  pathway,
  title,
  description,
}: StandardCaptureProps) {
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const attribution = useMemo(
    () =>
      Object.fromEntries(
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].flatMap(
          (key) => {
            const value = params.get(key);
            return value ? [[key, value]] : [];
          },
        ),
      ),
    [params],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await prospectService.capture({
        party: 'applicant',
        full_name: String(data.get('full_name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? '') || undefined,
        source: `pathway_${pathway}`,
        visa_interest: pathway,
        consent_given: data.get('consent') === 'on',
        consent_text: CONSENT_TEXT,
        answers: { situation: String(data.get('situation') ?? '') },
        attribution,
      });
      setReference(result.human_ref);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cloud pb-20 md:pb-0">
      <Header />
      <main className="container max-w-2xl px-4 py-12 md:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Subclass {pathway}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-navy">{title}</h1>
        <p className="mt-4 text-navy-muted">{description}</p>

        {reference ? (
          <section className="mt-8 rounded-2xl border bg-white p-7 shadow-soft-sm">
            <h2 className="text-xl font-bold text-navy">Enquiry received</h2>
            <p className="mt-3 text-navy-muted">
              Your reference is <strong className="font-mono">{reference}</strong>.
              This is a contact request, not an eligibility decision.
            </p>
            <Button asChild className="mt-6">
              <Link to="/consultation">View consultation options</Link>
            </Button>
          </section>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border bg-white p-7 shadow-soft-sm">
            <div><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required maxLength={160} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" maxLength={40} /></div>
            <div><Label htmlFor="situation">Tell us about your situation</Label><Textarea id="situation" name="situation" required maxLength={4000} rows={6} /></div>
            <label className="flex items-start gap-3 text-sm text-navy-muted">
              <Checkbox name="consent" required />
              <span>{CONSENT_TEXT}</span>
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send enquiry'}</Button>
          </form>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
