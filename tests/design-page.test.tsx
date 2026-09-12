import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DesignPage from '@/app/design/page';

describe('/design token gallery', () => {
  it('renders every colour token and component stub', () => {
    render(<DesignPage />);
    for (const token of ['bg.raised', 'accent', 'premium', 'danger']) {
      expect(screen.getByText(token)).toBeInTheDocument();
    }
    for (const stub of ['StatCard', 'PlayerDrawer', 'ThresholdBar', 'MethodNote']) {
      expect(screen.getByText(stub)).toBeInTheDocument();
    }
  });
});
