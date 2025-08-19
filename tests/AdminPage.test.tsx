import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import AdminPage from '../components/AdminPage';

jest.mock('../services/airtableService');

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<AdminPage />);
    expect(screen.getByText(/AI Services Administration/i)).toBeInTheDocument();
  });
});