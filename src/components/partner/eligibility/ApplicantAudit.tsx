import { useState, type FormEvent } from 'react';
import { ArrowRight, Info, Folder, UserRound, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OccupationSearchField } from '@/components/prescreen/OccupationSearchField';
import { CONSENT_TEXT, toApplicantPayload, toBusinessPayload, type Answers } from '@/components/prescreen/formDefinition';
import { preScreenService, type PreScreenResult as Result } from '@/services/preScreenService';
import './applicantAudit.css';

type Field = { id: string; label: string; hint?: string; type?: string; options?: string[]; optional?: boolean; when?: (a: Answers) => boolean };
const yesNo = ['Yes', 'No'];
const yes = (id: string) => (a: Answers) => a[id] === 'Yes';
const countries = (() => {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const codes = 'AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR BN BG BF BI KH CM CA CV KY CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW'.split(' ');
  return codes.map(code => names.of(code) || code).sort();
})();
const salary = ['Less than $79,423', '$79,423 – $100,000', '$100,000 – $120,000', '$120,000 – $140,000', 'More than $140,000'];
const years = ['Less than 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '6–10 years', 'More than 10 years'];
const applicantSteps: { title?: string; fields: Field[] }[] = [
  { title: "Let's get started", fields: [
    { id: 'first_name', label: "What is the applicant's First Name?", hint: 'The applicant is the person applying for a visa' },
    { id: 'last_name', label: "What is the applicant's Last Name?", hint: 'The applicant is the person applying for a visa', optional: true },
    { id: 'has_employer', label: 'Has a company offered to sponsor the applicant?', hint: 'The applicant must have a sponsoring business to be eligible.', options: yesNo },
    { id: 'employer_name', label: 'What is the name of the company who has offered to sponsor {name}?', when: yes('has_employer') },
    { id: 'business_address', label: "What's {company}'s address?", when: yes('has_employer') },
    { id: 'abn', label: "What's {company}'s ABN (Australian Business Number)?", when: yes('has_employer') },
  ] },
  { fields: [
    { id: 'salary_band', label: 'What is the salary for the role?', hint: 'The Core Skills Income Threshold shown in this assessment is $79,423. This figure excludes super, commission and bonuses.', options: salary, type: 'select' },
    { id: 'current_pay', label: 'What are you currently paid?', hint: "If you are unsure, choose 'I don’t know'", options: [...salary, "I don't know"], type: 'select', optional: true },
  ] },
  { title: 'Tell us about your current situation', fields: [
    { id: 'country', label: 'Where does {name} currently live?', hint: 'Type your country name to make it easier to find and select', options: countries, type: 'country' },
    { id: 'legal_status', label: "What is {name}'s legal status in {country}?", options: ['Citizen', 'Permanent Resident', 'Temporary Visa', 'No legal status', 'Other'] },
  ] },
  { title: 'Tell us a bit about you', fields: [{ id: 'passport', label: '{name}, which passport do you hold?', hint: 'UK, USA, Canada, New Zealand, and the Republic of Ireland are exempt from English language testing requirements.', options: countries, type: 'country' }] },
  { title: 'Tell us about your English skills', fields: [
    { id: 'english_study', label: '{name}, have you completed at least 5 years of full-time, English-only study at a secondary or higher education level?', options: yesNo },
    { id: 'english_tested', label: 'Has {name} taken an English test within the last 3 years?', options: yesNo },
    { id: 'english_overall', label: 'What was the overall English test score?', hint: 'Enter the IELTS-equivalent overall score. IELTS band scores are between 0 and 9, in whole or half bands.', type: 'range', when: yes('english_tested') },
    { id: 'english_lowest_band', label: 'What was the lowest score in any English test component?', hint: 'Enter the lowest IELTS-equivalent score across listening, reading, writing and speaking.', type: 'range', when: yes('english_tested') },
  ] },
  { title: 'Tell us about the business that has offered to sponsor you', fields: [
    { id: 'employed', label: 'Are you currently employed by {company}?', options: yesNo },
    { id: 'website', label: 'Provide the website URL of {company}?', hint: "For example, if Uber was sponsoring you, enter www.uber.com", optional: true },
  ] },
  { title: 'Tell us about your qualifications', fields: [
    { id: 'highest_qualification', label: '{name}, what is the highest qualification that you hold?', hint: 'The Department of Home Affairs considers both qualifications and work experience when determining eligibility.', type: 'select', options: ['Doctorate', 'Masters degree', 'Bachelor degree', 'Diploma', 'Certificate', 'Secondary school', 'No formal qualification'] },
    { id: 'related_qualification', label: 'Do you have a qualification that relates to the occupation for which you will be nominated?', hint: 'For example, a relevant qualification for a Marketing Specialist would be a degree in Marketing, Advertising, Business Communications, or Public Relations.', options: yesNo },
    { id: 'qualification', label: "What's your qualification?", when: yes('related_qualification') },
  ] },
  { title: 'Tell us about your work experience', fields: [
    { id: 'total_experience', label: '{name}, how many years of work experience do you have in total?', hint: 'Include all work experience, including work that is not relevant to the nominated occupation.', type: 'select', options: years },
    { id: 'relevant_experience', label: 'How many years of relevant work experience do you have?', hint: 'Only include experience relevant to the nominated occupation. You must have at least 12 months of relevant experience. Without a relevant qualification, 3–5 years may be required depending on the occupation.', type: 'select', options: years },
  ] },
  { title: 'Match your occupation', fields: [{ id: 'occupation_name', label: "{name}, select the occupation in the Government's Core Skills List that is most relevant to your occupation", hint: "Type your occupation. If you cannot find it, choose 'I don’t know'.", type: 'occupation' }] },
  { fields: [{ id: 'visa_issues', label: 'Has {name} ever experienced any of the visa issues below in any country (including Australia)?', hint: '• Refusal or rejection of visa application\n• Overstay of visa\n• Cancellation of visa\n• Deportation', options: yesNo }] },
  { fields: [
    { id: 'adult', label: 'Is {name} older than 18 years of age?', hint: 'You will need to verify this information later', options: yesNo },
    { id: 'dob', label: "What's your date of birth?", type: 'date', optional: true, when: yes('adult') },
  ] },
  { fields: [{ id: 'family', label: "Aside from {name}, how many members of {name}'s family unit (or immediate family) are migrating to Australia with {name}?", hint: 'Member of family unit in immigration means your spouse, de facto partner or children.', options: ['0', '1', '2 or more'] }] },
  { fields: [{ id: 'incentive', label: 'Has {name} provided any form of payment, gift or other incentive to {company}, for the purpose of being sponsored/nominated?', options: yesNo }] },
  { fields: [{ id: 'has_skills_assessment', label: 'Has {name} completed a skills assessment?', hint: 'A skills assessment checks that your skills meet the standards to work in a relevant occupation. This can be done later if required.', options: yesNo }] },
  { fields: [{ id: 'technology', label: 'How comfortable is {name} with using computers, mobile phones and modern technology?', hint: 'We use Google Meet and other technology tools to work with clients during the visa application process.', options: ['Very comfortable', 'Somewhat comfortable', 'Not comfortable'] }] },
  { fields: [{ id: 'conviction', label: 'Has {name} ever been convicted of an offence in any country?', hint: 'This includes any conviction now removed from official records. Failing to declare an offence may result in visa refusal.', options: yesNo }] },
  { fields: [{ id: 'health', label: 'Does {name}, or any migrating family members, have any serious health conditions or diseases?', hint: 'This may include HIV, diabetes, tuberculosis, hepatitis B or C, cancer within the last five years, severe mental health issues, extended hospital admissions or ongoing medication.', options: yesNo }] },
  { fields: [{ id: 'referral', label: 'How did you hear about us?', optional: true, options: ['Instagram', 'LinkedIn', 'TikTok', 'ChatGPT (or equivalent)', 'Other', 'Referral', 'Google', 'Reddit', 'Facebook'] }] },
  { fields: [{ id: 'email', label: 'What is your email address?', hint: "We'll send a copy of your eligibility results to your email.", type: 'email' }] },
];

const businessSalary = ['Less than $70,000', '$70,000 - $80,000', '$80,000 - $100,000', '$100,000 - $120,000', '$120,000 - $140,000', 'More than $140,000'];
const businessSteps: { title?: string; fields: Field[] }[] = [
  { title: "Let's get started", fields: [
    { id: 'legal_name', label: 'What is the name of the business?', hint: 'Enter the full registered entity name, including “Pty Ltd” or “Ltd” where applicable. Do not enter the trading name.' },
    { id: 'abn', label: 'What is the ABN of the business?', hint: 'Make sure this is the business entity that is employing the applicant.' },
    { id: 'business_address', label: 'What is the business address?' },
    { id: 'is_trust', label: 'Is the business a trust or trustee?', options: yesNo },
    { id: 'full_name', label: "What's your first name?", hint: 'We need the first name as contact for the business' },
    { id: 'contact_position', label: "What's your position in the business?", optional: true },
  ] },
  { fields: [
    { id: 'sponsored_last_5_years', label: 'Has the business sponsored an employee in the last 5 years?', options: yesNo },
    { id: 'is_standard_business_sponsor', label: 'Is the business a Standard Business Sponsor (SBS)?', hint: 'A Standard Business Sponsor is a business approved by the Department of Home Affairs to nominate skilled foreign workers for visas.', options: yesNo, when: yes('sponsored_last_5_years') },
  ] },
  { fields: [
    { id: 'has_candidate', label: 'Does the business have a candidate you wish to sponsor for an Australian visa?', hint: 'The candidate may be a current employee or a person that the business would like to employ in the future.', options: yesNo },
    { id: 'position_title', label: 'What is the position title of the role that the business plans to nominate for?', hint: 'This may be the current role title of the candidate if they are an existing employee.', optional: true, when: yes('has_candidate') },
    { id: 'occupation_name', label: 'Select the most relevant occupation from the Core Skills Occupation List', hint: 'Start typing the occupation into the text box.', type: 'occupation', optional: true, when: yes('has_candidate') },
  ] },
  { fields: [
    { id: 'salary_band', label: 'What is the salary for the role?', hint: 'The income threshold shown in this assessment is $79,423, excluding super.', type: 'select', options: businessSalary },
    { id: 'willing_to_pay_threshold', label: 'Is the business willing to pay more than $79,423 base salary (excluding super) for the role?', options: yesNo, when: a => businessSalary.slice(0, 2).includes(String(a.salary_band)) },
    { id: 'candidate_current_pay_band', label: 'What is the applicant or employee currently paid?', hint: "If you are unsure, choose 'I don’t know'", type: 'select', options: [...businessSalary, "I don't know"], optional: true },
  ] },
  { fields: [{ id: 'annual_revenue_band', label: 'What was the annual revenue of the business last financial year?', hint: 'Select the most accurate.', type: 'select', options: ['Less than $500,000', '$500,000 - $1M', '$1M - $5M', '$5M - $10M', '$10M - $15M', '$15M or more'] }] },
  { fields: [
    { id: 'years_operating_band', label: 'How long has the business been operating for in Australia?', hint: 'Choose the most accurate.', type: 'select', options: ['Less than 1 year', '1 - 2 years', '2 - 3 years', '3 - 4 years', '4 years or more', 'It does not operate in Australia'] },
    { id: 'operates_only_in_australia', label: 'Does the business operate only in Australia?', options: yesNo },
    { id: 'overseas_country', label: 'Where overseas does the business operate?', hint: 'Select the country. Type the country into the text box.', type: 'country', options: countries, optional: true, when: a => a.operates_only_in_australia === 'No' },
  ] },
  { fields: [
    { id: 'employee_count_band', label: 'How many employees are currently employed full time by the business and based in Australia?', hint: 'Choose the most accurate.', type: 'select', options: ['Less than 5', '5 - 10', '10 - 20', '21 or more'] },
    { id: 'has_temporary_visa_employees', label: 'Are any of the current employees on a temporary visa in Australia?', options: yesNo },
  ] },
  { fields: [{ id: 'referral_source', label: 'How did you hear about us?', optional: true, options: ['TikTok', 'Facebook', 'Referral', 'Google', 'LinkedIn', 'Other', 'Instagram', 'ChatGPT (or equivalent)', 'Reddit'] }] },
  { fields: [{ id: 'job_description', label: 'Upload the Job Description for the role', hint: 'This will help your lawyer understand the role. If you don’t have it yet, you can click Next to progress.', type: 'file', optional: true }] },
  { fields: [
    { id: 'email', label: 'What is the best email to contact you?', hint: 'Our lawyers will contact you about your business enquiry.', type: 'email' },
    { id: 'phone', label: "What's your contact number?", hint: 'Include your country code, for example +61.', type: 'tel' },
  ] },
  { fields: [
    { id: 'candidate_name', label: 'What is the name of the candidate?', hint: 'We also need to assess the applicant’s eligibility for sponsorship.', optional: true },
    { id: 'candidate_nationality', label: 'What is the nationality of the candidate?', type: 'country', options: countries, optional: true },
    { id: 'candidate_email', label: "What is the candidate's email address?", hint: 'Provide their email so our lawyers can follow up about their eligibility.', type: 'email', optional: true },
  ] },
];

export function EligibilityIllustration({ business = false }: { business?: boolean }) {
  return <span className="audit-illustration" aria-hidden="true">{business ? <Briefcase /> : <UserRound />}</span>;
}

export function ApplicantAudit() {
  const [phase, setPhase] = useState<'choice' | 'intro' | 'quiz' | 'businessIntro' | 'result'>('choice');
  const [party, setParty] = useState<'applicant' | 'business'>('applicant');
  const steps = party === 'business' ? businessSteps : applicantSteps;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const personalize = (text: string) => text.replaceAll('{name}', String(answers.first_name || 'the applicant')).replaceAll('{company}', String(answers.employer_name || 'the sponsoring business')).replaceAll('{country}', String(answers.country || 'their country'));
  const move = (next: typeof phase) => { setPhase(next); setError(''); window.scrollTo({ top: 0 }); };
  const patch = (values: Answers) => setAnswers(previous => {
    const next = { ...previous, ...values };
    for (const step of steps) for (const field of step.fields) if (field.when && !field.when(next)) delete next[field.id];
    return next;
  });
  const start = (selected: typeof party) => { setParty(selected); setIndex(0); setAnswers({}); setConsent(false); setResume(null); move(selected === 'business' ? 'businessIntro' : 'intro'); };
  const shortApplicant = party === 'applicant' && answers.has_employer === 'No';
  const activeIndexes = steps.map((_, i) => i).filter(i => party === 'business' ? (i !== 3 && i !== 8 && i !== 10) || answers.has_candidate === 'Yes' : !shortApplicant || [0, 17, 18].includes(i));
  const position = activeIndexes.indexOf(index);
  const fields = steps[index].fields.filter(f => !f.when || f.when(answers));
  const last = position === activeIndexes.length - 1;
  const next = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!consent && last) { setError('Please agree to the collection notice before submitting.'); return; }
    if (fields.some(f => !f.optional && !String(answers[f.id] || '').trim() && f.type !== 'range')) { setError('Please answer all required questions.'); return; }
    if (!last) { setIndex(activeIndexes[position + 1]); window.scrollTo({ top: 0 }); return; }
    setBusy(true);
    try {
      const age = answers.dob ? Math.floor((Date.now() - new Date(String(answers.dob)).getTime()) / 31557600000) : undefined;
      const mapped: Answers = { ...answers, english_overall: answers.english_tested === 'Yes' ? String(answers.english_overall || '0') : undefined, english_lowest_band: answers.english_tested === 'Yes' ? String(answers.english_lowest_band || '0') : undefined, full_name: `${answers.first_name} ${answers.last_name || ''}`.trim(), age: age === undefined ? undefined : String(age), onshore: answers.country ? (answers.country === 'Australia' ? 'Yes' : 'No') : undefined, years_experience: answers.relevant_experience ? String(parseInt(String(answers.relevant_experience), 10) || 0) : undefined, has_health_or_character_concern: answers.health === 'Yes' || answers.conviction === 'Yes' ? 'Yes' : answers.health === 'No' && answers.conviction === 'No' ? 'No' : undefined };
      const payload = party === 'business' ? toBusinessPayload(answers) : toApplicantPayload(mapped);
      if (party === 'business' && payload.business && answers.has_candidate !== 'Yes') { payload.business.nomination = undefined; }
      const raw = party === 'business' ? { ...answers } : { ...mapped };
      if (party === 'business' && answers.has_candidate !== 'Yes') for (const key of ['position_title', 'occupation_name', 'occupation_code', 'salary_band', 'willing_to_pay_threshold', 'candidate_current_pay_band', 'candidate_name', 'candidate_nationality', 'candidate_email']) delete raw[key];
      if (payload.sponsoring_employer) { payload.sponsoring_employer.abn = String(answers.abn || ''); payload.sponsoring_employer.business_address = String(answers.business_address || ''); }
      if (payload.offered_role) { payload.offered_role.salary_band = String(answers.salary_band || ''); payload.offered_role.annual_salary = [0, 79423, 100000, 120000, 140000][salary.indexOf(String(answers.salary_band))]; payload.offered_role.candidate_current_pay_band = String(answers.current_pay || ''); }
      payload.raw_answers = { ...raw, consent_text: CONSENT_TEXT, [party === 'business' ? 'job_description_name' : 'resume_name']: resume?.name };
      payload.source = `partner_audit_${party}`;
      const response = await preScreenService.submit(payload); setResult(response); move('result');
    } catch { setError('Unable to submit your assessment. Please try again.'); } finally { setBusy(false); }
  };
  return <div className="applicant-audit">
    {phase === 'choice' && <section className="audit-choice"><h1>Let's check your eligibility</h1><p>When we check your eligibility we're assessing two things - if you meet the Department of Immigration's requirements to apply for a visa and if you meet our client requirements for a successful application.</p><p className="audit-prompt">Select an option below to get started</p><div className="audit-cards">{['Businesses', 'Applicants'].map((party, i) => <button key={party} onClick={() => start(i === 0 ? 'business' : 'applicant')}><EligibilityIllustration business={i === 0} /><h2>For {party}</h2></button>)}</div></section>}
    {phase === 'intro' && <section className="audit-content audit-intro"><EligibilityIllustration /><h1>Check applicant eligibility for an Employer Sponsored visa</h1><h3>Subclasses 482 and 186.</h3><div className="audit-intro-copy"><p>Complete this short questionnaire and submit your details. Our lawyers will review your enquiry and contact you about the next steps.</p><p className="audit-muted">Time to complete: 5 minutes.</p></div><aside><Info size={22} /><span>If you are a business keen to understand your eligibility, please complete <button onClick={() => start('business')}>this quiz</button>.</span></aside><Button variant="elite" size="lg" className="audit-next" onClick={() => move('quiz')}>Check eligibility<ArrowRight /></Button><button className="audit-back" onClick={() => move('choice')}>Back</button></section>}
    {phase === 'businessIntro' && <section className="audit-content audit-intro"><EligibilityIllustration business /><h1>Check if the business is eligible for sponsorship and nomination</h1><h3>Subclasses 482 and 186 sponsorship, nomination and visas.</h3><div className="audit-intro-copy"><p>Complete a short quiz to tell us about the business and its sponsorship needs.</p><p>After you submit, our lawyers will review your enquiry and contact you.</p><p className="audit-muted">Time to complete: 5 minutes.</p></div><aside><Info size={22} /><span>If you are an applicant or employee and would like to check your eligibility, please complete <button onClick={() => start('applicant')}>this quiz</button>.</span></aside><Button variant="elite" size="lg" className="audit-next" onClick={() => move('quiz')}>Check eligibility<ArrowRight /></Button><button className="audit-back" onClick={() => move('choice')}>Back</button></section>}
    {phase === 'quiz' && <><div className="audit-step"><div className="audit-step-label"><span>{steps[index].title || (party === 'business' ? 'Business eligibility' : 'Applicant eligibility')}</span><span>Step {position + 1} of {activeIndexes.length}</span></div><Progress value={((position + 1) / activeIndexes.length) * 100} className="h-2" /></div><form className="audit-content" onSubmit={next}>{steps[index].title && <h1>{steps[index].title}</h1>}<div className="audit-fields">{fields.map(field => <div className="audit-field" key={field.id}><label id={`${field.id}-label`} htmlFor={field.id}>{personalize(field.label)}{!field.optional && <span className="audit-required"> *</span>}</label>{field.hint && <p>{field.hint}</p>}
      {field.options && !field.type ? <div className={`audit-options ${field.options.length > 3 ? 'audit-options-many' : ''}`} role="radiogroup" aria-labelledby={`${field.id}-label`}>{field.options.map(option => <label className={answers[field.id] === option ? 'selected' : ''} key={option}><input type="radio" name={field.id} value={option} checked={answers[field.id] === option} required={!field.optional} onChange={() => patch({ [field.id]: option })} />{option}</label>)}</div>
      : field.type === 'occupation' ? <><OccupationSearchField id={field.id} value={String(answers.occupation_name || '')} onSelect={choice => patch({ occupation_name: choice.occupation_name, occupation_code: choice.anzsco_code })} onClear={() => patch({ occupation_name: undefined, occupation_code: undefined })} /><label className="audit-unknown"><input type="checkbox" checked={answers.occupation_name === "I don't know"} onChange={e => patch({ occupation_name: e.target.checked ? "I don't know" : undefined, occupation_code: undefined })} /> I don't know</label><input className="audit-validation" tabIndex={-1} aria-label="Occupation selection" value={String(answers.occupation_name || '')} required={!field.optional} readOnly /></>
      : field.type === 'file' ? <><label className="audit-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setResume(e.dataTransfer.files[0] || null); }}><Folder /><span>{resume?.name || <>Drag & drop a file or <u>browse</u></>}</span><input id={field.id} type="file" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files?.[0] || null)} /></label><p className="audit-file-note">File upload is not yet connected. You can submit without a job description.</p></>
      : field.type === 'select' ? <select id={field.id} value={String(answers[field.id] || '')} required={!field.optional} onChange={e => patch({ [field.id]: e.target.value })}><option value="">Select an option</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select>
      : field.type === 'range' ? <><input id={field.id} type="range" min="0" max="9" step="0.5" value={String(answers[field.id] || '0')} onChange={e => patch({ [field.id]: e.target.value })} /><div className="audit-range-label"><span>0.0</span><output>{answers[field.id] || '0.0'}</output><span>9.0</span></div></>
      : <><input id={field.id} type={field.type === 'country' ? 'text' : field.type || 'text'} list={field.type === 'country' ? 'audit-countries' : undefined} value={String(answers[field.id] || '')} required={!field.optional} max={field.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined} onChange={e => patch({ [field.id]: e.target.value })} autoComplete={field.type === 'email' ? 'email' : undefined} />{field.type === 'country' && <datalist id="audit-countries">{countries.map(country => <option key={country} value={country} />)}</datalist>}</>}
    </div>)}</div>{last && <>{party === 'applicant' && <div className="audit-field"><label htmlFor="resume">Upload your resume</label><label className="audit-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setResume(e.dataTransfer.files[0] || null); }}><Folder /><span>{resume?.name || <>Drag & drop a file or <u>browse</u></>}</span><input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files?.[0] || null)} /></label><p className="audit-file-note">Resume selection is available; file upload is not yet connected. Your assessment can be submitted without a resume.</p></div>}<label className="audit-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />{CONSENT_TEXT}</label></>}{error && <p role="alert" className="text-red-700">{error}</p>}<div className="audit-actions"><Button variant="elite" size="lg" type="submit" className="audit-next" disabled={busy}>{busy ? 'Submitting…' : last ? 'Submit' : <>Next <ArrowRight /></>}</Button><button type="button" className="audit-back" disabled={busy} onClick={() => { if (position > 0) setIndex(activeIndexes[position - 1]); else move(party === 'business' ? 'businessIntro' : 'intro'); setError(''); window.scrollTo({ top: 0 }); }}>Back</button></div></form></>}
    {phase === 'result' && result && <section className="audit-content audit-intro text-center" role="status"><CheckCircle2 className="mx-auto mb-6 h-14 w-14 text-gold-dark" /><h1>Submitted successfully</h1><p className="text-navy-muted">Thank you for submitting your {party === 'business' ? 'business' : 'applicant'} enquiry. Our lawyers will review your details and contact you.</p>{result.human_ref && <p className="mt-6 text-sm text-navy-muted">Your reference: <strong className="font-mono text-navy">{result.human_ref}</strong></p>}<Button variant="elite" className="mt-8" onClick={() => move('choice')}>Back to eligibility</Button></section>}

  </div>;
}
