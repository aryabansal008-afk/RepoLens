export const seedPosts = [
  {
    id: 'seed-how-repolens-reads-github',
    slug: 'how-repolens-reads-github',
    title: 'How RepoLens reads GitHub',
    excerpt: 'What the public API can prove, and why missing history stays blank.',
    category: 'GitHub Analytics',
    tags: ['api', 'rate limits', 'methodology'],
    status: 'published',
    featured: true,
    author: 'RepoLens',
    coverImage: '',
    createdAt: '2026-04-12T00:00:00.000Z',
    updatedAt: '2026-04-12T00:00:00.000Z',
    publishedAt: '2026-04-12T00:00:00.000Z',
    content: `RepoLens is a lens, not a second source of truth. Every number on a repository or developer page is either returned by GitHub or calculated from records GitHub returned.

The browser calls the public REST API without a token. That is enough for repository metadata, language bytes, search, and the statistics endpoints GitHub already aggregates. It is also rate limited, often to 60 requests an hour for the calling IP. RepoLens does not put a personal access token in frontend code.

Some views are intentionally empty. GitHub's REST API does not offer an official trending rank, a complete star timeline for large repositories, or a contribution calendar without an authenticated GraphQL request. RepoLens labels the method it actually used, such as "created this week and sorted by stars," instead of presenting that list as GitHub Trending.

If a chart depends on the latest 100 pull requests or commits, the caption says so. A partial sample is useful. A guessed history is not.`,
  },
  {
    id: 'seed-repository-history',
    slug: 'reading-repository-history',
    title: 'Reading a repository without inventing its history',
    excerpt: 'Weekly commit stats, code frequency, and the limits of issue and pull request samples.',
    category: 'Repository Insights',
    tags: ['commits', 'pull requests', 'charts'],
    status: 'published',
    featured: false,
    author: 'RepoLens',
    coverImage: '',
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: '2026-04-18T00:00:00.000Z',
    publishedAt: '2026-04-18T00:00:00.000Z',
    content: `A repository page can look sparse for a young project and dense for an old one. That difference should come from the data, not from the layout.

GitHub's commit activity statistic is a year of weekly totals, already split by weekday. Code frequency is weekly additions and deletions. Participation splits the same year between the owner and everyone else. Those series can be filtered to 7, 30, 90, or 365 days because each point has a week timestamp or a known position in the 52-week array.

Pull requests and issues are different. The REST list used here is the 100 most recently updated records. Charts built from that list are samples. The open issue count on the overview is the repository field GitHub publishes, and that field includes open pull requests. The label says so.

Star history is drawn only when every stargazer timestamp for a small repository was returned. Larger repositories get an explicit unavailable state.`,
  },
  {
    id: 'seed-search-qualifiers',
    slug: 'searching-with-github-qualifiers',
    title: 'Searching with GitHub qualifiers',
    excerpt: 'How a keyword, a language, and a star floor become one GitHub search query.',
    category: 'Open Source',
    tags: ['search', 'languages'],
    status: 'published',
    featured: false,
    author: 'RepoLens',
    coverImage: '',
    createdAt: '2026-05-02T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    publishedAt: '2026-05-02T00:00:00.000Z',
    content: `The advanced search box does not invent a ranking model. It builds a GitHub repository search query and shows you the qualifiers.

A language chosen from the Languages page becomes \`language:"Go"\`. Minimum stars become \`stars:>=1000\`. An update date becomes \`pushed:>=\` that day. Archived status, topic, owner, and forks are the same idea. The results are whatever GitHub Search returns, including its cap on reported totals.

A single word typed on the homepage is not assumed to be a username. \`react\` can be a repository, a person, or both, so RepoLens asks GitHub for both and lets you choose. A full \`owner/repo\` string or a github.com URL is specific enough to open that record directly.

Developer search uses the user search endpoint. Repository filters stay in the form, but they only apply when the search type includes repositories.`,
  },
  {
    id: 'seed-public-events',
    slug: 'public-events-are-a-sample',
    title: 'Public events are a sample, not a total',
    excerpt: 'Why the Total Events view counts a snapshot of the public timeline.',
    category: 'Developer Productivity',
    tags: ['events', 'methodology'],
    status: 'published',
    featured: false,
    author: 'RepoLens',
    coverImage: '',
    createdAt: '2026-05-20T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z',
    publishedAt: '2026-05-20T00:00:00.000Z',
    content: `GitHub's public events API returns a recent slice of activity on the platform. It does not return the number of events ever created.

RepoLens keeps the Total Events entry in the navigation and uses it for that snapshot. The large number is the count of events in the response, grouped by type. Actor and repository links open the same developer and repository views as the rest of the app.

Refresh asks GitHub for the timeline again. If the rate limit is exhausted, the page shows the error instead of replaying an older sample as if it were new.

Treat the page as a live window. For durable trends, use a repository's own statistics, which GitHub aggregates per project.`,
  },
];
