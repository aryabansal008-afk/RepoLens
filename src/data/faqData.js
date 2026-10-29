export const faqSections = [
  {
    id: 'general',
    title: 'General questions',
    items: [
      {
        id: 'what-is-repolens',
        question: 'What is RepoLens?',
        answer:
          'RepoLens is a dark, search-first interface for public GitHub repository and developer data. It shows repository statistics, search results, language snapshots, a blog, and a sample of public events.',
      },
      {
        id: 'official-github',
        question: 'Is this an official GitHub product?',
        answer:
          'No. RepoLens reads public GitHub APIs and labels the method behind each list or chart. It is not affiliated with GitHub.',
      },
      {
        id: 'accounts',
        question: 'Do I need an account to look someone up?',
        answer:
          'No. Search, repository pages, developer pages, languages, and published articles work without signing in. Local blog drafts stay in the browser and are not part of the public site.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'GitHub data and analytics',
    items: [
      {
        id: 'not-invented',
        question: 'Why are some charts missing?',
        answer:
          'If GitHub does not return a series, RepoLens leaves it blank and explains why. Star history for large repositories and the contribution calendar are the two most common cases. The calendar needs an authenticated GraphQL request, which this frontend does not make.',
      },
      {
        id: 'commit-stats',
        question: 'Where do commit charts come from?',
        answer:
          'Weekly totals and weekday counts come from GitHub’s commit activity statistic. Hour-of-day counts use the 100 most recent commits and are labeled as a sample in your local timezone.',
      },
      {
        id: 'issues-prs',
        question: 'Do open issue counts include pull requests?',
        answer:
          'The repository field GitHub calls open_issues_count includes open pull requests. RepoLens keeps that meaning in the label. Issue charts separately ignore items that are pull requests, using the latest 100 updated issue records.',
      },
    ],
  },
  {
    id: 'search',
    title: 'Repository search',
    items: [
      {
        id: 'trending',
        question: 'Are trending repositories official GitHub Trending?',
        answer:
          'No. The discovery list is GitHub repository search for non-forks created in the selected window, sorted by stars. The page states that method next to the results.',
      },
      {
        id: 'ambiguous',
        question: 'What happens if I search for a single word?',
        answer:
          'A single word stays ambiguous. RepoLens searches repositories and users, unless you paste owner/repo or a github.com URL that identifies one record.',
      },
      {
        id: 'language-click',
        question: 'What happens when I choose a language?',
        answer:
          'The language opens Data Explore with that language qualifier already applied. You can add stars, dates, topics, and sorting from there.',
      },
    ],
  },
  {
    id: 'developers',
    title: 'Developer profiles',
    items: [
      {
        id: 'public-only',
        question: 'Which developer data is visible?',
        answer:
          'Only the public profile, public repositories, and public events GitHub returns. Private contributions are not inferred.',
      },
      {
        id: 'calendar',
        question: 'Why is the contribution calendar often unavailable?',
        answer:
          'GitHub exposes that calendar through GraphQL, which needs an authenticated request. RepoLens does not send a personal access token from the browser, so the calendar stays unavailable. Public repositories and public events still load from the REST API.',
      },
      {
        id: 'languages',
        question: 'How are a developer’s languages calculated?',
        answer:
          'Primary languages on non-fork public repositories are weighted by star count. It is not a byte-level language breakdown, and the page says so.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Authentication and privacy',
    items: [
      {
        id: 'tokens',
        question: 'Does RepoLens use a GitHub token?',
        answer:
          'No. The app calls public GitHub REST endpoints without a token. A token is never placed in frontend code or in a React environment variable.',
      },
      {
        id: 'admin',
        question: 'Who can publish articles?',
        answer:
          'Published articles are the Markdown content bundled in the frontend. The draft page can edit, preview, import, and export articles in this browser, but those drafts are not the public blog until they are added to the site bundle and rebuilt.',
      },
      {
        id: 'support-mail',
        question: 'What does the support form store?',
        answer:
          'Nothing. If a support email is configured, the form opens a mailto link in your email app. RepoLens does not store the message and does not report it as sent.',
      },
    ],
  },
  {
    id: 'limits',
    title: 'API rate limits',
    items: [
      {
        id: 'sixty',
        question: 'Why do requests fail after a while?',
        answer:
          'Unauthenticated GitHub requests are limited, commonly to 60 per hour for the calling IP. RepoLens caches recent responses and surfaces the rate-limit error instead of substituting made-up data.',
      },
      {
        id: 'token-limit',
        question: 'Can this frontend raise the GitHub rate limit?',
        answer:
          'No. Raising the limit requires a token, and RepoLens does not embed one in the browser. Wait for the reset time shown on the rate-limit banner, or use the app from a network that still has quota.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      {
        id: 'not-found',
        question: 'A repository or user shows as missing.',
        answer:
          'The account may be private, renamed, deleted, or spelled differently. RepoLens shows GitHub’s not-found response rather than a placeholder profile.',
      },
      {
        id: 'stats-wait',
        question: 'Commit statistics say GitHub is still computing them.',
        answer:
          'GitHub sometimes answers those endpoints with “accepted” and asks the client to try again. Use Try again on the page after a short wait.',
      },
      {
        id: 'blog-offline',
        question: 'How do local blog drafts become public articles?',
        answer:
          'Export the draft as JSON or Markdown from the local drafts page, add it to src/data/blogSeed.js, and rebuild the frontend. Saving a draft only writes to this browser.',
      },
    ],
  },
];
