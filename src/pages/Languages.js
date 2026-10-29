import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Languages.css';
import usePageTitle from '../hooks/usePageTitle';
import { searchRepositories } from '../services/githubApi';
import { formatFull } from '../utils/formatNumbers';

const popularLanguages = [
  { name: 'JavaScript', color: '#f7df1e' },
  { name: 'Python', color: '#3776ab' },
  { name: 'Java', color: '#b07219' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'C++', color: '#f34b7d' },
  { name: 'Go', color: '#00add8' },
  { name: 'Rust', color: '#B7410E' },
  { name: 'C', color: '#434344ff' },
];

const allLanguages = [
  'ActionScript', 'Ada', 'Apex', 'Assembly', 'Bash', 'C', 'C#', 'C++', 'Clojure', 'CoffeeScript', 'CSS',
  'Dart', 'Elixir', 'Erlang', 'F#', 'Fortran', 'Go', 'Groovy', 'Haskell', 'HTML', 'Java', 'JavaScript', 'Julia', 'Kotlin',
  'Lua', 'MATLAB', 'Nix', 'Objective-C', 'OCaml', 'Pascal', 'Perl', 'PHP', 'PowerShell', 'Prolog', 'Python',
  'R', 'Ruby', 'Rust', 'Scala', 'Shell', 'SQL', 'Swift', 'TypeScript', 'Vim script', 'Vue', 'WebAssembly', 'XML', 'YAML', 'Zig',
];

const githubName = {
  'Vim script': 'Vim Script',
};

const groupedLanguages = allLanguages.reduce((acc, lang) => {
  const letter = lang[0].toUpperCase();
  if (!acc[letter]) acc[letter] = [];
  acc[letter].push(lang);
  return acc;
}, {});

function exploreHref(name) {
  const language = githubName[name] || name;
  return `/data-explore?language=${encodeURIComponent(language)}`;
}

async function mapPool(items, limit, fn) {
  const output = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      output[current] = await fn(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return output;
}

function Languages() {
  usePageTitle('Languages');
  const [stats, setStats] = useState({});
  const [note, setNote] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    mapPool(popularLanguages, 2, async (language) => {
      try {
        const data = await searchRepositories({
          q: `language:"${language.name}"`,
          sort: 'stars',
          perPage: 1,
          signal: controller.signal,
        });
        const top = data.items?.[0];
        return {
          name: language.name,
          count: data.total_count,
          incomplete: data.incomplete_results,
          topName: top?.full_name || '—',
          topStars: top ? formatFull(top.stargazers_count) : '—',
        };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        return { name: language.name, error: error.message };
      }
    })
      .then((rows) => {
        if (cancelled) return;
        const next = {};
        rows.filter(Boolean).forEach((row) => {
          next[row.name] = row;
        });
        setStats(next);
        if (rows.some((row) => row?.error)) setNote('Some language snapshots could not be loaded. Cards still open repository search.');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (!cancelled) setNote(error.message);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <div className="languages-page">
      <div className="languages-head">
        <h1>Explore by Language</h1>
        <p>Discover public repositories by the language GitHub has indexed for them.</p>
      </div>
      <section className="popular-section">
        <h4 className="section-title">Most Popular</h4>
        <p className="language-note">
          Card order is the existing RepoLens set, not an official popularity rank.
          Repository counts come from GitHub Search and can be capped or marked incomplete.
          The star figure is the most-starred repository in that search, not a global star total.
        </p>
        {note ? <p className="language-note">{note}</p> : null}
        <div className="popular-grid">
          {popularLanguages.map((lang, idx) => {
            const stat = stats[lang.name];
            return (
              <Link className="language-card" to={exploreHref(lang.name)} key={lang.name} aria-label={`Explore ${lang.name} repositories`}>
                <div className="rank-badge">#{idx + 1}</div>
                <div className="lang-header">
                  <div className="lang-icon" style={{ backgroundColor: lang.color, color: lang.color, border: `1px solid ${lang.color}100` }}>
                    {lang.name[0]}
                  </div>
                  <div className="lang-name">{lang.name}</div>
                </div>
                <div className="metrics">
                  <div className="metric-row">
                    <span>Indexed repos</span>
                    <span className="metric-val">
                      {stat?.error ? 'Unavailable' : stat ? `${formatFull(stat.count)}${stat.incomplete ? '+' : ''}` : '…'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span>Top repository</span>
                    <span className="metric-val">{stat?.topName || '…'}</span>
                  </div>
                  <div className="metric-row">
                    <span>Stars on top repo</span>
                    <span className="metric-val">{stat?.topStars || '…'}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="alphabetical-section">
        <h4 className="section-title">All Languages</h4>
        <div className="alphabet-container">
          {Object.keys(groupedLanguages).sort().map((letter) => (
            <div className="alphabet-group" key={letter}>
              <h4 className="letter-heading">{letter}</h4>
              <div className="language-grid">
                {groupedLanguages[letter].sort().map((lang) => (
                  <Link className="lang-item" to={exploreHref(lang)} key={lang}>{lang}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Languages;
