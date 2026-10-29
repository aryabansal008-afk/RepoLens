import { useMemo, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { faqSections } from '../../data/faqData';
import FAQAccordion from '../../components/FAQAccordion/FAQAccordion';

const EMPTY = { name: '', email: '', subject: '', message: '' };

function mailtoHref(address, fields) {
  const params = new URLSearchParams();
  if (fields.subject) params.set('subject', fields.subject);
  const body = [
    fields.name ? `Name: ${fields.name}` : '',
    fields.email ? `Reply to: ${fields.email}` : '',
    fields.message || '',
  ].filter(Boolean).join('\n\n');
  if (body) params.set('body', body);
  const query = params.toString();
  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
}

export default function FAQ() {
  usePageTitle('FAQs');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState({ value: 'keep', nonce: 0 });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const supportEmail = (process.env.REACT_APP_SUPPORT_EMAIL || '').trim();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !needle || `${item.question} ${item.answer}`.toLowerCase().includes(needle)),
      }))
      .filter((section) => section.items.length);
  }, [query]);

  function prefill(subject) {
    setForm((current) => ({ ...current, subject }));
    setStatusMessage('');
    document.getElementById('support-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('support-subject')?.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (form.message.trim().length < 10) nextErrors.message = 'Message should be at least 10 characters.';
    setErrors(nextErrors);
    setStatusMessage('');
    if (Object.keys(nextErrors).length) return;
    if (!supportEmail) {
      setStatusMessage('No support address is configured, so this message was not sent.');
      return;
    }
    window.location.href = mailtoHref(supportEmail, form);
  }

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">FAQs</h1>
        <p className="lede">How RepoLens uses GitHub, what it refuses to guess, and how to reach support.</p>
      </header>
      <div className="faq-tools">
        <label>
          <span className="sr-only">Search questions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" />
        </label>
        <div className="card-actions">
          <button type="button" className="btn-ghost" onClick={() => setMode({ value: 'all', nonce: Date.now() })}>Expand all</button>
          <button type="button" className="btn-ghost" onClick={() => setMode({ value: 'none', nonce: Date.now() })}>Collapse all</button>
          <a
            className="btn-ghost"
            href={supportEmail ? mailtoHref(supportEmail, { subject: 'Bug report' }) : '#support-form'}
            onClick={() => prefill('Bug report')}
          >
            Report a bug
          </a>
          <a
            className="btn-ghost"
            href={supportEmail ? mailtoHref(supportEmail, { subject: 'Feature request' }) : '#support-form'}
            onClick={() => prefill('Feature request')}
          >
            Request a feature
          </a>
        </div>
      </div>

      {visible.length === 0 ? <p className="lede">No questions match that search.</p> : null}
      {visible.map((section) => (
        <section key={section.id} className="stack-gap">
          <h2>{section.title}</h2>
          <FAQAccordion items={section.items} mode={mode.value} modeNonce={mode.nonce} />
        </section>
      ))}

      <section className="panel support-panel" id="support-form">
        <h2>Contact support</h2>
        <p>
          {supportEmail ? (
            <>Write to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. The form opens that address in your email app. RepoLens does not send or store the message.</>
          ) : (
            <>No support address is configured. Set REACT_APP_SUPPORT_EMAIL and rebuild before using this form. Nothing is sent from the page.</>
          )}
        </p>
        <form onSubmit={onSubmit} noValidate>
          <div className="filter-grid">
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" />
              {errors.name ? <small className="form-error">{errors.name}</small> : null}
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
              {errors.email ? <small className="form-error">{errors.email}</small> : null}
            </label>
            <label>
              <span>Subject</span>
              <input id="support-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              {errors.subject ? <small className="form-error">{errors.subject}</small> : null}
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
            {errors.message ? <small className="form-error">{errors.message}</small> : null}
          </label>
          <button className="btn-solid" type="submit">Open email</button>
        </form>
        {statusMessage ? (
          <p className="form-error" role="alert">{statusMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
