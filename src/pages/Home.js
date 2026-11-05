import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero';
import usePageTitle from '../hooks/usePageTitle';
import { PageSkeleton } from '../components/LoadingSkeleton/LoadingSkeleton';

const DeveloperOverview = lazy(() => import('../components/DeveloperOverview/DeveloperOverview'));

function Home() {
  usePageTitle('Home');
  const [params] = useSearchParams();
  const user = (params.get('user') || '').trim();

  return (
    <>
      <Hero compact={Boolean(user)} />
      {user ? (
        <Suspense fallback={<PageSkeleton />}>
          <DeveloperOverview username={user} variant="home" />
        </Suspense>
      ) : null}
    </>
  );
}

export default Home;
