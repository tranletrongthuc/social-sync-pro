import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KhongMinhSuggestion from './components/KhongMinhSuggestion';

// Mock the icons
jest.mock('./components/icons', () => ({
  KhongMinhIcon: () => <div data-testid="khongminh-icon" />,
  LinkIcon: () => <div data-testid="link-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  ChevronLeftIcon: () => <div data-testid="chevron-left-icon" />,
  ChevronRightIcon: () => <div data-testid="chevron-right-icon" />,
}));

// Mock the Button component
jest.mock('./components/ui', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className} 
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

describe('KhongMinhSuggestion Component', () => {
  const mockAffiliateLinks = [
    {
      id: '1',
      productId: 'p1',
      productName: 'Product 1',
      price: 100,
      salesVolume: 50,
      providerName: 'Provider 1',
      commissionRate: 10,
      commissionValue: 10,
      productLink: 'https://example.com/product1',
    },
    {
      id: '2',
      productId: 'p2',
      productName: 'Product 2',
      price: 200,
      salesVolume: 100,
      providerName: 'Provider 2',
      commissionRate: 15,
      commissionValue: 30,
      productLink: 'https://example.com/product2',
    },
    {
      id: '3',
      productId: 'p3',
      productName: 'Product 3',
      price: 300,
      salesVolume: 150,
      providerName: 'Provider 3',
      commissionRate: 20,
      commissionValue: 60,
      productLink: 'https://example.com/product3',
    },
  ];

  const defaultProps = {
    acceptedProducts: [],
    suggestedProducts: mockAffiliateLinks,
    isAnalyzing: false,
    isAnyAnalysisRunning: false,
    onAccept: jest.fn(),
    language: 'English',
    onRunAnalysis: jest.fn(),
    affiliateLinksCount: 3,
  };

  it('should display suggested products in a carousel', () => {
    render(<KhongMinhSuggestion {...defaultProps} />);
    
    // Check that the first product is displayed
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    
    // Check that carousel navigation buttons are present
    const prevButton = screen.getByRole('button', { name: '' }); // Previous button
    const nextButton = screen.getByRole('button', { name: '' }); // Next button
    
    expect(prevButton).toBeDisabled(); // First item, so previous should be disabled
    expect(nextButton).not.toBeDisabled(); // Not last item, so next should be enabled
  });

  it('should navigate through suggested products using carousel buttons', () => {
    render(<KhongMinhSuggestion {...defaultProps} />);
    
    // Initially shows first product
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    
    // Click next button
    const nextButton = screen.getAllByRole('button', { name: '' })[1];
    fireEvent.click(nextButton);
    
    // Should now show second product
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    
    // Click next button again
    fireEvent.click(nextButton);
    
    // Should now show third product
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    
    // Next button should now be disabled (last item)
    expect(nextButton).toBeDisabled();
  });

  it('should display accepted products separately', () => {
    const propsWithAccepted = {
      ...defaultProps,
      acceptedProducts: [mockAffiliateLinks[0]],
      suggestedProducts: mockAffiliateLinks.slice(1), // Only products 2 and 3 as suggestions
    };
    
    render(<KhongMinhSuggestion {...propsWithAccepted} />);
    
    // Check that accepted product is displayed
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Promoted Product')).toBeInTheDocument();
    
    // Check that suggested products are displayed (should show Product 2 first)
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should call onAccept when accept button is clicked', () => {
    const onAcceptMock = jest.fn();
    const props = {
      ...defaultProps,
      onAccept: onAcceptMock,
    };
    
    render(<KhongMinhSuggestion {...props} />);
    
    // Click accept button for first product
    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);
    
    // Check that onAccept was called with the correct product ID
    expect(onAcceptMock).toHaveBeenCalledWith('1');
  });

  it('should show "Get Suggestions" button when no suggestions or accepted products', () => {
    const props = {
      ...defaultProps,
      suggestedProducts: [],
      acceptedProducts: [],
    };
    
    render(<KhongMinhSuggestion {...props} />);
    
    // Check that "Get Suggestions" button is displayed
    expect(screen.getByText('Get Suggestions')).toBeInTheDocument();
  });

  it('should not show "Get Suggestions" button when there are suggestions', () => {
    render(<KhongMinhSuggestion {...defaultProps} />);
    
    // Check that "Get Suggestions" button is not displayed
    expect(screen.queryByText('Get Suggestions')).not.toBeInTheDocument();
  });

  it('should not show "Get Suggestions" button when there are accepted products but no suggestions', () => {
    const props = {
      ...defaultProps,
      suggestedProducts: [],
      acceptedProducts: [mockAffiliateLinks[0]],
    };
    
    render(<KhongMinhSuggestion {...props} />);
    
    // Check that "Get Suggestions" button is not displayed
    expect(screen.queryByText('Get Suggestions')).not.toBeInTheDocument();
  });
});