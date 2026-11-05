import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchRepositories, searchUsers } from '../services/githubApi';
import { developerPath, parseGitHubQuery, repositoryPath } from '../utils/githubUrlParser';
import useLocalList, { publishLists } from '../hooks/useLocalList';
import { STORAGE_KEYS, isSearchEntry, rememberSearch } from '../utils/localLists';

const USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

function SearchBar() {
  const navigate = useNavigate();
  const listId = useId();
  const shellRef = useRef(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);
  const [mode, setMode] = useState('auto');
  const recent = useLocalList(STORAGE_KEYS.searches, isSearchEntry);

  function record(query, searchMode) {
    rememberSearch(window.localStorage, query, searchMode);
    publishLists();
  }

  useEffect(() => {
    const query = value.trim();
    const parsed = parseGitHubQuery(query);
    if (query.length < 2 || parsed.kind === 'invalid') {
      setItems([]);
      setLoading(false);
      setSuggestError('');
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setSuggestError('');
      const term = parsed.kind === 'repo' ? `${parsed.owner}/${parsed.repo}` : parsed.kind === 'user' ? parsed.username : query;
      Promise.all([
        searchRepositories({ q: term, perPage: 4, signal: controller.signal }).catch((error) => {
          if (error.name === 'AbortError') throw error;
          return null;
        }),
        searchUsers({ q: term, perPage: 4, signal: controller.signal }).catch((error) => {
          if (error.name === 'AbortError') throw error;
          return null;
        }),
      ])
        .then(([repos, users]) => {
          const next = [];
          if (parsed.kind === 'repo') {
            next.push({
              id: `direct-repo-${parsed.owner}-${parsed.repo}`,
              label: `Open ${parsed.owner}/${parsed.repo}`,
              meta: 'Repository',
              href: repositoryPath(parsed.owner, parsed.repo),
            });
          } else if (parsed.kind === 'user') {
            next.push({
              id: `direct-user-${parsed.username}`,
              label: `Open ${parsed.username}`,
              meta: 'Developer',
              href: developerPath(parsed.username),
            });
          }
          (users?.items || []).forEach((user) => {
            next.push({
              id: `user-${user.login}`,
              label: user.login,
              meta: 'Developer',
              href: developerPath(user.login),
            });
          });
          (repos?.items || []).forEach((repo) => {
            next.push({
              id: `repo-${repo.full_name}`,
              label: repo.full_name,
              meta: repo.language || 'Repository',
              href: repositoryPath(repo.owner.login, repo.name),
            });
          });
          setItems(next);
          setActive(-1);
          setOpen(true);
          if (!users && !repos) setSuggestError('Suggestions are unavailable. You can still search.');
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setSuggestError('Suggestions are unavailable. You can still search.');
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!shellRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function go(href) {
    setOpen(false);
    navigate(href);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (active >= 0 && items[active]) {
      go(items[active].href);
      return;
    }
    const parsed = parseGitHubQuery(value);
    if (parsed.kind === 'empty') {
      setError('Enter a GitHub username, repository, or URL.');
      return;
    }
    if (parsed.kind === 'invalid') {
      setError(parsed.message);
      return;
    }
    if (mode === 'developer') {
      const login = value.trim().replace(/^@/, '');
      if (!USERNAME.test(login)) {
        setError('Enter a GitHub username, such as torvalds.');
        return;
      }
      setError('');
      record(login, 'developer');
      go(`/?user=${encodeURIComponent(login)}`);
      return;
    }
    if (mode === 'repository' && parsed.kind !== 'repo') {
      setError('Enter owner/repo or a github.com repository URL.');
      return;
    }
    setError('');
    if (parsed.kind === 'repo') {
      record(`${parsed.owner}/${parsed.repo}`, 'repository');
      go(repositoryPath(parsed.owner, parsed.repo));
    } else if (parsed.kind === 'user') {
      record(parsed.username, 'developer');
      go(`/?user=${encodeURIComponent(parsed.username)}`);
    } else {
      record(parsed.query, 'search');
      go(`/data-explore?q=${encodeURIComponent(parsed.query)}&type=all`);
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!open || !items.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
    }
  }

  const showMenu = open && (loading || suggestError || items.length > 0);

  const showRecent = open && value.trim().length < 2 && recent.length > 0;

  return (
    <form className="search-shell" role="search" onSubmit={onSubmit} ref={shellRef}>
      <div className="segmented search-mode" role="group" aria-label="Search mode">
        <button type="button" className={mode === 'auto' ? 'active' : undefined} aria-pressed={mode === 'auto'} onClick={() => setMode('auto')}>Auto</button>
        <button type="button" className={mode === 'developer' ? 'active' : undefined} aria-pressed={mode === 'developer'} onClick={() => setMode('developer')}>Developer</button>
        <button type="button" className={mode === 'repository' ? 'active' : undefined} aria-pressed={mode === 'repository'} onClick={() => setMode('repository')}>Repository</button>
      </div>
      <div className="search-container" role="combobox" aria-expanded={showMenu || showRecent} aria-haspopup="listbox" aria-controls={listId}>
        <label className="sr-only" htmlFor="hero-search">Search GitHub</label>
        <input
          id="hero-search"
          type="text"
          className="search-input"
          placeholder="Username, repository, or GitHub URL"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setValue('');
              setError('');
              setItems([]);
              setOpen(false);
            }}
          >
            Clear
          </button>
        ) : null}
        <button className="search-button" type="submit">Search</button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {showRecent ? (
        <ul className="search-suggest" id={listId} role="listbox">
          <li className="suggest-status">Recent searches</li>
          {recent.map((item) => (
            <li key={`${item.mode}-${item.query}`} role="presentation">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(item.query);
                  setMode(item.mode === 'developer' || item.mode === 'repository' ? item.mode : 'auto');
                  setOpen(false);
                }}
              >
                <span>{item.query}</span>
                <small>{item.mode}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {showMenu ? (
        <ul className="search-suggest" id={listId} role="listbox">
          {loading ? <li className="suggest-status">Looking up GitHub…</li> : null}
          {suggestError ? <li className="suggest-status">{suggestError}</li> : null}
          {items.map((item, index) => (
            <li key={item.id} role="presentation">
              <button
                type="button"
                role="option"
                id={`${listId}-${index}`}
                aria-selected={active === index}
                className={active === index ? 'active' : undefined}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(item.href)}
              >
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

export default SearchBar;
