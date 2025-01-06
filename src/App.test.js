import { render, screen } from '@testing-library/react';
import PrebidConfig from './PrebidConfig';

test('renders learn react link', () => {
  render(<PrebidConfig />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
