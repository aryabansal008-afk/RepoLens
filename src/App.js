import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './styles/shared.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import RateLimitBanner from './components/RateLimitBanner';
import { PageSkeleton } from './components/LoadingSkeleton/LoadingSkeleton';

const Languages = React.lazy(() => import('./pages/Languages'));
const DataExplore = lazy(() => import('./pages/DataExplore/DataExplore'));
const RepositoryDetails = lazy(() => import('./pages/DataExplore/RepositoryDetails'));
const DeveloperProfile = lazy(() => import('./pages/DataExplore/DeveloperProfile'));
const BlogList = lazy(() => import('./pages/Blog/BlogList'));
const BlogDetails = lazy(() => import('./pages/Blog/BlogDetails'));
const BlogEditor = lazy(() => import('./pages/Blog/BlogEditor'));
const FAQ = lazy(() => import('./pages/FAQ/FAQ'));
const Events = lazy(() => import('./pages/Events/Events'));
const NotFound = lazy(() => import('./pages/NotFound'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-shell">
          <h1 className="page-title">This page hit a problem</h1>
          <p className="lede">{this.state.error.message}</p>
          <button type="button" className="btn-solid" onClick={() => this.setState({ error: null })}>Try again</button>
        </main>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className={`container ${isHome ? 'bg-home' : 'bg-dark-spotlights'}`}>
      <Navbar />
      <RateLimitBanner />
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/languages" element={<Languages />} />
            <Route path="/data-explore" element={<DataExplore />} />
            <Route path="/data-explore/repository/:owner/:repo" element={<RepositoryDetails />} />
            <Route path="/data-explore/developer/:username" element={<DeveloperProfile />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetails />} />
            <Route path="/admin/blog" element={<BlogEditor />} />
            <Route path="/admin/blog/:slug/edit" element={<BlogEditor />} />
            <Route path="/faqs" element={<FAQ />} />
            <Route path="/events" element={<Events />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {isHome ? null : <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
