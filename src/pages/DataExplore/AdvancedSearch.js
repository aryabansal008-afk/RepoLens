import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const FIELDS = ['q', 'type', 'language', 'owner', 'stars', 'forks', 'created', 'updated', 'archived', 'topic', 'sort'];

function readFilters(params) {
  return {
    q: params.get('q') || '',
    type: params.get('type') || 'repositories',
    language: params.get('language') || '',
    owner: params.get('owner') || '',
    stars: params.get('stars') || '',
    forks: params.get('forks') || '',
    created: params.get('created') || '',
    updated: params.get('updated') || '',
    archived: params.get('archived') || '',
    topic: params.get('topic') || '',
    sort: params.get('sort') || '',
  };
}

function sameFilters(left, right) {
  return FIELDS.every((key) => left[key] === right[key]);
}

function numberError(value, label) {
  if (value === '') return '';
  if (!/^\d+$/.test(value)) return `${label} must be a whole number.`;
  return '';
}

export default function AdvancedSearch() {
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  const [draft, setDraft] = useState(() => readFilters(params));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDraft(readFilters(new URLSearchParams(paramsKey)));
  }, [paramsKey]);

  useEffect(() => {
    const starsError = numberError(draft.stars, 'Minimum stars');
    const forksError = numberError(draft.forks, 'Minimum forks');
    if (starsError || forksError) return undefined;
    const current = readFilters(new URLSearchParams(paramsKey));
    if (sameFilters(draft, current)) return undefined;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(paramsKey);
      FIELDS.forEach((key) => next.delete(key));
      next.delete('page');
      FIELDS.forEach((key) => {
        const value = draft[key];
        if (!value) return;
        if (key === 'type' && value === 'repositories') return;
        next.set(key, value);
      });
      setParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [draft, paramsKey, setParams]);

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === 'stars' || key === 'forks') {
      setErrors((current) => ({ ...current, [key]: numberError(value, key === 'stars' ? 'Minimum stars' : 'Minimum forks') }));
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    const starsError = numberError(draft.stars, 'Minimum stars');
    const forksError = numberError(draft.forks, 'Minimum forks');
    setErrors({ stars: starsError, forks: forksError });
    if (starsError || forksError) return;
    const next = new URLSearchParams(params);
    FIELDS.forEach((key) => next.delete(key));
    next.delete('page');
    FIELDS.forEach((key) => {
      const value = draft[key].trim ? draft[key].trim() : draft[key];
      if (!value) return;
      if (key === 'type' && value === 'repositories') return;
      next.set(key, value);
    });
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    FIELDS.forEach((key) => next.delete(key));
    next.delete('page');
    setParams(next);
  }

  const repoSorts = draft.type === 'users'
    ? [['', 'Best match'], ['followers', 'Followers'], ['repositories', 'Repositories'], ['joined', 'Recently joined']]
    : [['', 'Best match'], ['stars', 'Stars'], ['forks', 'Forks'], ['updated', 'Recently updated']];

  return (
    <form className="search-panel panel" onSubmit={onSubmit}>
      <div className="search-panel-top">
        <label>
          <span>Search</span>
          <input
            value={draft.q}
            onChange={(event) => update('q', event.target.value)}
            placeholder="Repository, username, or keyword"
          />
        </label>
        <label>
          <span>Type</span>
          <select value={draft.type} onChange={(event) => update('type', event.target.value)}>
            <option value="repositories">Repositories</option>
            <option value="users">Developers</option>
            <option value="all">Both</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={repoSorts.some(([id]) => id === draft.sort) ? draft.sort : ''} onChange={(event) => update('sort', event.target.value)}>
            {repoSorts.map(([id, label]) => <option value={id} key={label}>{label}</option>)}
          </select>
        </label>
      </div>
      <div className="filter-grid">
        <label>
          <span>Language</span>
          <input value={draft.language} onChange={(event) => update('language', event.target.value)} placeholder="TypeScript" />
        </label>
        <label>
          <span>Owner</span>
          <input value={draft.owner} onChange={(event) => update('owner', event.target.value)} placeholder="facebook" />
        </label>
        <label>
          <span>Minimum stars</span>
          <input inputMode="numeric" value={draft.stars} onChange={(event) => update('stars', event.target.value)} placeholder="100" />
        </label>
        <label>
          <span>Minimum forks</span>
          <input inputMode="numeric" value={draft.forks} onChange={(event) => update('forks', event.target.value)} placeholder="10" />
        </label>
        <label>
          <span>Created after</span>
          <input type="date" value={draft.created} onChange={(event) => update('created', event.target.value)} />
        </label>
        <label>
          <span>Updated after</span>
          <input type="date" value={draft.updated} onChange={(event) => update('updated', event.target.value)} />
        </label>
        <label>
          <span>Archived</span>
          <select value={draft.archived} onChange={(event) => update('archived', event.target.value)}>
            <option value="">Any</option>
            <option value="false">Hide archived</option>
            <option value="true">Only archived</option>
          </select>
        </label>
        <label>
          <span>Topic</span>
          <input value={draft.topic} onChange={(event) => update('topic', event.target.value)} placeholder="react" />
        </label>
      </div>
      {draft.type === 'users' ? (
        <p className="chart-note">Language, stars, forks, dates, topic, and archived status apply to repository search only.</p>
      ) : null}
      {errors.stars ? <p className="form-error">{errors.stars}</p> : null}
      {errors.forks ? <p className="form-error">{errors.forks}</p> : null}
      <div className="card-actions">
        <button type="submit" className="btn-solid">Search</button>
        <button type="button" className="btn-ghost" onClick={clearFilters}>Clear</button>
      </div>
    </form>
  );
}
