import React from 'react';
import { render } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

it('renders', () => {
  const title = 'checking something with the user';
  const { getByText } = render(<ConfirmDialog isOpen title={title} />);
  expect(getByText(title)).toBeInTheDocument();
});
