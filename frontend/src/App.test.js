import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome back message', () => {
  render(<App />);
  const linkElement = screen.getByText(/Welcome Back/i);
  expect(linkElement).toBeInTheDocument();
});
