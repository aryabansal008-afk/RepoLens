/**
 * GitHub's contribution calendar is a GraphQL field. That endpoint requires an
 * authenticated token. RepoLens does not put a token in frontend code, and it
 * does not invent calendar squares from public events.
 */
export async function fetchContributionCalendar() {
  return {
    available: false,
    reason:
      'GitHub’s contribution calendar is only available through an authenticated GraphQL request. RepoLens calls public REST endpoints from the browser and does not send a token, so this calendar is left blank.',
  };
}
