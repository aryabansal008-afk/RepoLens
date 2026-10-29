const DAY_MS = 24 * 60 * 60 * 1000;

export function rangeStart(range, now = Date.now()) {
  const days = { 7: 7, 30: 30, 90: 90, 365: 365 }[String(range)] || 365;
  return now - days * DAY_MS;
}

export function startOfWeek(time) {
  const date = new Date(time);
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return midnight - date.getUTCDay() * DAY_MS;
}

export function formatChartDay(time) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(time));
}

export function weeklyCommits(weeks, range, now) {
  if (!Array.isArray(weeks)) return [];
  const start = rangeStart(range, now);
  return weeks
    .filter((week) => week && typeof week.week === 'number' && week.week * 1000 >= start - 6 * DAY_MS)
    .map((week) => ({
      label: formatChartDay(week.week * 1000),
      commits: week.total || 0,
    }));
}

export function weekdayTotals(weeks, range, now) {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  if (!Array.isArray(weeks)) {
    return labels.map((label) => ({ label, commits: 0 }));
  }
  const start = rangeStart(range, now);
  weeks.forEach((week) => {
    if (!week || typeof week.week !== 'number' || week.week * 1000 < start - 6 * DAY_MS) return;
    (week.days || []).forEach((count, index) => {
      if (index < 7) totals[index] += count || 0;
    });
  });
  return labels.map((label, index) => ({ label, commits: totals[index] }));
}

export function hourBuckets(commits, range, now) {
  const start = rangeStart(range, now);
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    label: String(hour).padStart(2, '0'),
    commits: 0,
  }));
  const list = Array.isArray(commits) ? commits : [];
  let inRange = 0;
  list.forEach((commit) => {
    const iso = commit?.commit?.author?.date || commit?.commit?.committer?.date;
    if (!iso) return;
    const time = new Date(iso).getTime();
    if (Number.isNaN(time) || time < start) return;
    buckets[new Date(time).getHours()].commits += 1;
    inRange += 1;
  });
  return { buckets, sampleSize: list.length, inRange };
}

export function languageSeries(languages) {
  if (!languages || typeof languages !== 'object' || Array.isArray(languages)) return [];
  const entries = Object.entries(languages).filter(([, bytes]) => typeof bytes === 'number' && bytes > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name,
      bytes,
      share: total ? (bytes / total) * 100 : 0,
    }));
}

function collectWeekly(items, range, now, createBucket, visit) {
  const start = rangeStart(range, now);
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    visit(item, (iso, key) => {
      if (!iso) return;
      const time = new Date(iso).getTime();
      if (Number.isNaN(time) || time < start) return;
      const week = startOfWeek(time);
      if (!map.has(week)) {
        map.set(week, { label: formatChartDay(week), week, ...createBucket() });
      }
      map.get(week)[key] += 1;
    });
  });
  return [...map.values()].sort((a, b) => a.week - b.week);
}

export function pullSeries(pulls, range, now) {
  const list = Array.isArray(pulls) ? pulls : [];
  return {
    points: collectWeekly(
      list,
      range,
      now,
      () => ({ opened: 0, merged: 0, closed: 0 }),
      (item, add) => {
        add(item.created_at, 'opened');
        add(item.merged_at, 'merged');
        if (!item.merged_at) add(item.closed_at, 'closed');
      }
    ),
    sampleSize: list.length,
  };
}

export function issueSeries(issues, range, now) {
  const list = Array.isArray(issues) ? issues : [];
  const onlyIssues = list.filter((item) => !item.pull_request);
  return {
    points: collectWeekly(
      onlyIssues,
      range,
      now,
      () => ({ opened: 0, closed: 0 }),
      (item, add) => {
        add(item.created_at, 'opened');
        add(item.closed_at, 'closed');
      }
    ),
    sampleSize: list.length,
    issueCount: onlyIssues.length,
  };
}

export function codeFrequencySeries(rows, range, now) {
  if (!Array.isArray(rows)) return [];
  const start = rangeStart(range, now);
  return rows
    .filter((row) => Array.isArray(row) && typeof row[0] === 'number' && row[0] * 1000 >= start - 6 * DAY_MS)
    .map(([week, additions, deletions]) => ({
      label: formatChartDay(week * 1000),
      additions: additions || 0,
      deletions: Math.abs(deletions || 0),
    }));
}

export function participationSeries(participation, range, now = Date.now()) {
  if (!participation || !Array.isArray(participation.all)) return [];
  const start = rangeStart(range, now);
  const endWeek = startOfWeek(now);
  const length = participation.all.length;
  return participation.all
    .map((commits, index) => {
      const week = endWeek - (length - 1 - index) * 7 * DAY_MS;
      return {
        label: formatChartDay(week),
        week,
        everyone: commits || 0,
        owner: participation.owner?.[index] || 0,
      };
    })
    .filter((point) => point.week >= start - 6 * DAY_MS);
}

export function starSeries(stargazers) {
  if (!Array.isArray(stargazers) || stargazers.length === 0) return [];
  const sorted = stargazers
    .filter((entry) => entry && entry.starred_at)
    .sort((a, b) => new Date(a.starred_at) - new Date(b.starred_at));
  const map = new Map();
  let cumulative = 0;
  sorted.forEach((entry) => {
    const week = startOfWeek(new Date(entry.starred_at).getTime());
    cumulative += 1;
    map.set(week, cumulative);
  });
  const weeks = [...map.keys()].sort((a, b) => a - b);
  if (!weeks.length) return [];
  const points = [];
  let last = 0;
  for (let week = weeks[0]; week <= weeks[weeks.length - 1]; week += 7 * DAY_MS) {
    if (map.has(week)) last = map.get(week);
    points.push({ label: formatChartDay(week), week, stars: last });
  }
  return points;
}

export function contributorSeries(contributors) {
  if (!Array.isArray(contributors)) return [];
  return contributors
    .filter((person) => person && (person.login || person.name))
    .slice(0, 10)
    .map((person) => ({
      login: person.login || person.name,
      contributions: person.contributions || 0,
    }));
}

export function developerLanguages(repos) {
  const totals = new Map();
  (Array.isArray(repos) ? repos : []).forEach((repo) => {
    if (!repo || !repo.language || repo.fork) return;
    const weight = Math.max(1, Number(repo.stargazers_count) || 0);
    totals.set(repo.language, (totals.get(repo.language) || 0) + weight);
  });
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((total, [, value]) => total + value, 0);
  return entries.slice(0, 8).map(([name, weight]) => ({
    name,
    weight,
    share: sum ? (weight / sum) * 100 : 0,
  }));
}

export function trendingQuery(range) {
  const days = range === 'today' ? 1 : range === 'month' ? 30 : 7;
  const date = new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
  return `created:>=${date} stars:>=5 archived:false fork:false`;
}

export function buildRepositoryQuery(filters) {
  const parts = [];
  const query = String(filters.q || '').trim();
  if (query) parts.push(query);
  if (filters.language) parts.push(`language:"${String(filters.language).replace(/"/g, '')}"`);
  if (filters.owner) parts.push(`user:${String(filters.owner).trim()}`);
  if (filters.stars !== undefined && filters.stars !== '' && Number(filters.stars) >= 0) {
    parts.push(`stars:>=${Math.floor(Number(filters.stars))}`);
  }
  if (filters.forks !== undefined && filters.forks !== '' && Number(filters.forks) >= 0) {
    parts.push(`forks:>=${Math.floor(Number(filters.forks))}`);
  }
  if (filters.created) parts.push(`created:>=${filters.created}`);
  if (filters.updated) parts.push(`pushed:>=${filters.updated}`);
  if (filters.archived === 'true') parts.push('archived:true');
  if (filters.archived === 'false') parts.push('archived:false');
  if (filters.topic) {
    parts.push(`topic:${String(filters.topic).trim().toLowerCase().replace(/\s+/g, '-')}`);
  }
  return parts.join(' ').trim();
}
