import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <p>RepoLens reads public GitHub data and labels the limits of each source.</p>
      <nav aria-label="Footer">
        <Link to="/data-explore">Data Explore</Link>
        <Link to="/languages">Languages</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/faqs">FAQs</Link>
      </nav>
    </footer>
  );
}
