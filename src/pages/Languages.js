import React from 'react';
import './Languages.css';

const popularLanguages = [
{ name: 'JavaScript', color: '#f7df1e', prs: '2.3M+', stars: '15M+', issues: '3.5M+' },
{ name: 'Python',     color: '#3776ab', prs: '1.8M+', stars: '18M+', issues: '3.2M+' },
{ name: 'Java',       color: '#b07219', prs: '1.2M+', stars: '8M+',  issues: '2.1M+' },
{ name: 'TypeScript', color: '#3178c6', prs: '1.5M+', stars: '10M+', issues: '1.8M+' },
{ name: 'C++',        color: '#f34b7d', prs: '800K+', stars: '7M+',  issues: '1.4M+' },
{ name: 'Go',         color: '#00add8', prs: '1.1M+', stars: '9M+',  issues: '1.0M+' },
{ name: 'Rust',       color: '#B7410E', prs: '400K+', stars: '6M+',  issues: '500K+' },
{ name: 'C',          color: '#434344ff', prs: '300K+', stars: '5M+', issues: '400K+' },
];

const allLanguages = [
  'ActionScript', 'Ada', 'Apex', 'Assembly','Bash', 'C', 'C#', 'C++', 'Clojure', 'CoffeeScript', 'CSS',
  'Dart', 'Elixir', 'Erlang', 'F#', 'Fortran','Go', 'Groovy', 'Haskell', 'HTML','Java', 'JavaScript', 'Julia', 'Kotlin',
  'Lua', 'MATLAB', 'Nix', 'Objective-C', 'OCaml', 'Pascal', 'Perl', 'PHP', 'PowerShell', 'Prolog', 'Python',
  'R', 'Ruby', 'Rust', 'Scala', 'Shell', 'SQL', 'Swift','TypeScript', 'Vim script', 'Vue', 'WebAssembly', 'XML', 'YAML', 'Zig'
];

const groupedLanguages = allLanguages.reduce((acc, lang) => {
  const letter = lang[0].toUpperCase();
  if (!acc[letter]) acc[letter] = [];
  acc[letter].push(lang);
  return acc;
}, {});

function Languages() {
  return (
    <div className="languages-page">
      <div className="languages-head">
      <h1>Explore by Language</h1>
      <p>Discover the most popular and fastest growing open source programming languages. </p></div>
      <section className="popular-section">
        <h4 className="section-title">Most Popular</h4>
        <div className="popular-grid">
          {popularLanguages.map((lang, idx) => (
            <div className="language-card" key={lang.name}>
              <div className="rank-badge">#{idx + 1}</div>
              <div className="lang-header">
                <div className="lang-icon" style={{ backgroundColor: lang.color, color: lang.color, border: `1px solid ${lang.color}100` }}>
                  {lang.name[0]}
                </div>
                <div className="lang-name">{lang.name}</div>
              </div>
              <div className="metrics">
                <div className="metric-row">
                  <span>Active PRs</span>
                  <span className="metric-val">{lang.prs}</span>
                </div>
                <div className="metric-row">
                  <span>New Stars</span>
                  <span className="metric-val">{lang.stars}</span>
                </div>
                <div className="metric-row">
                  <span>Issues Closed</span>
                  <span className="metric-val">{lang.issues}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="alphabetical-section">
        <h4 className="section-title">All Languages</h4>
        <div className="alphabet-container">
          {Object.keys(groupedLanguages).sort().map(letter => (
            <div className="alphabet-group" key={letter}>
              <h4 className="letter-heading">{letter}</h4>
              <div className="language-grid">
                {groupedLanguages[letter].sort().map(lang => (
                  <div className="lang-item" key={lang}>{lang}</div>
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
