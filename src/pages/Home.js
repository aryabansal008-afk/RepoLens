import React from 'react';
import Hero from '../components/Hero';
import usePageTitle from '../hooks/usePageTitle';

function Home() {
  usePageTitle('Home');
  return (
    <React.Fragment>
      <Hero />
    </React.Fragment>
  );
}

export default Home;
