import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the RepoLens search heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /github universe/i })).toBeInTheDocument();
});
