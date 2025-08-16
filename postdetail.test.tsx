import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostDetailModal from './components/PostDetailModal';

// Mock all the icons
jest.mock('./components/icons', () => ({
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  YouTubeIcon: () => <div data-testid="youtube-icon" />,
  FacebookIcon: () => <div data-testid="facebook-icon" />,
  InstagramIcon: () => <div data-testid="instagram-icon" />,
  TikTokIcon: () => <div data-testid="tiktok-icon" />,
  PinterestIcon: () => <div data-testid="pinterest-icon" />,
  DownloadIcon: () => <div data-testid="download-icon" />,
  UploadIcon: () => <div data-testid="upload-icon" />,
  LinkIcon: () => <div data-testid="link-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  VideoCameraIcon: () => <div data-testid="video-camera-icon" />,
  ChevronLeftIcon: () => <div data-testid="chevron-left-icon" />,
  ChevronRightIcon: () => <div data-testid="chevron-right-icon" />,
  KhongMinhIcon: () => <div data-testid="khongminh-icon" />,
}));

// Mock the UI components
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
  Input: ({ name, value, onChange, placeholder, className }: any) => (
    <input 
      name={name}
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={className} 
    />
  ),
  TextArea: ({ name, value, onChange, rows, className, placeholder }: any) => (
    <textarea 
      name={name}
      value={value} 
      onChange={onChange} 
      rows={rows} 
      className={className}
      placeholder={placeholder}
    />
  ),
  HoverCopyWrapper: ({ children }: any) => <div>{children}</div>,
}));

// Mock the KhongMinhSuggestion component
jest.mock('./components/KhongMinhSuggestion', () => {
  return function MockKhongMinhSuggestion(props: any) {
    return (
      <div data-testid="khongminh-suggestion">
        <div>Accepted: {props.acceptedProducts.length}</div>
        <div>Suggested: {props.suggestedProducts.length}</div>
        <button onClick={() => props.onRunAnalysis()}>Get Suggestions</button>
        <button onClick={() => props.onAccept(props.suggestedProducts[0]?.id)}>Accept First</button>
      </div>
    );
  };
});

describe('PostDetailModal - KhongMinh Suggestions', () => {
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
  ];

  const mockPostInfo = {
    planId: 'plan1',
    weekIndex: 0,
    postIndex: 0,
    post: {
      id: 'post1',
      platform: 'Facebook',
      contentType: 'Image Post',
      title: 'Test Post',
      content: 'Test content',
      hashtags: [],
      cta: 'Click here',
      status: 'draft',
      promotedProductIds: [],
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    postInfo: mockPostInfo,
    language: 'English',
    onUpdatePost: jest.fn(),
    onGenerateImage: jest.fn(),
    onSetImage: jest.fn(),
    onSetVideo: jest.fn(),
    onGeneratePrompt: jest.fn(),
    onRefinePost: jest.fn(),
    onRunKhongMinhForPost: jest.fn(),
    onAcceptSuggestion: jest.fn(),
    generatedImages: {},
    generatedVideos: {},
    isGeneratingImage: jest.fn(() => false),
    isGeneratingPrompt: false,
    isAnyAnalysisRunning: false,
    isAnalyzing: false,
    khongMinhSuggestions: {},
    affiliateLinks: mockAffiliateLinks,
    onGenerateComment: jest.fn(),
    isGeneratingComment: false,
    onOpenScheduleModal: jest.fn(),
    onPublishPost: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display accepted products when post has promotedProductIds', () => {
    const propsWithAccepted = {
      ...defaultProps,
      postInfo: {
        ...mockPostInfo,
        post: {
          ...mockPostInfo.post,
          promotedProductIds: ['1'],
        },
      },
    };

    render(<PostDetailModal {...propsWithAccepted} />);

    // Check that accepted products are displayed
    expect(screen.getByText('Promoted Products')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should display "Get Suggestions" button when no suggestions or accepted products', () => {
    render(<PostDetailModal {...defaultProps} />);

    // Check that "Get Suggestions" button is displayed
    expect(screen.getByText('Get Suggestions')).toBeInTheDocument();
  });

  it('should display suggestion carousel when suggestions are available', () => {
    const propsWithSuggestions = {
      ...defaultProps,
      khongMinhSuggestions: {
        'post1': mockAffiliateLinks,
      },
    };

    render(<PostDetailModal {...propsWithSuggestions} />);

    // Check that suggestion carousel is displayed
    expect(screen.getByText('Suggested: 2')).toBeInTheDocument();
    expect(screen.getByText('Accepted: 0')).toBeInTheDocument();
  });

  it('should filter out accepted products from suggestions', () => {
    const propsWithAcceptedAndSuggestions = {
      ...defaultProps,
      postInfo: {
        ...mockPostInfo,
        post: {
          ...mockPostInfo.post,
          promotedProductIds: ['1'],
        },
      },
      khongMinhSuggestions: {
        'post1': mockAffiliateLinks,
      },
    };

    render(<PostDetailModal {...propsWithAcceptedAndSuggestions} />);

    // Check that only one suggestion is shown (the non-accepted one)
    expect(screen.getByText('Suggested: 1')).toBeInTheDocument();
    // Check that accepted products are still shown
    expect(screen.getByText('Accepted: 1')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should hide suggestion block when all suggestions are accepted', () => {
    const propsWithAllAccepted = {
      ...defaultProps,
      postInfo: {
        ...mockPostInfo,
        post: {
          ...mockPostInfo.post,
          promotedProductIds: ['1', '2'],
        },
      },
      khongMinhSuggestions: {
        'post1': mockAffiliateLinks,
      },
    };

    render(<PostDetailModal {...propsWithAllAccepted} />);

    // Check that no suggestions are shown
    expect(screen.getByText('Suggested: 0')).toBeInTheDocument();
    // Check that accepted products are still shown
    expect(screen.getByText('Accepted: 2')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    // Check that "Get Suggestions" button is not displayed
    expect(screen.queryByText('Get Suggestions')).not.toBeInTheDocument();
  });

  it('should call onRunKhongMinhForPost when "Get Suggestions" is clicked', () => {
    const onRunKhongMinhForPost = jest.fn();
    const props = {
      ...defaultProps,
      onRunKhongMinhForPost,
    };

    render(<PostDetailModal {...props} />);

    // Click "Get Suggestions" button
    fireEvent.click(screen.getByText('Get Suggestions'));

    // Check that onRunKhongMinhForPost was called
    expect(onRunKhongMinhForPost).toHaveBeenCalledTimes(1);
  });

  it('should call onAcceptSuggestion when accept button is clicked', () => {
    const onAcceptSuggestion = jest.fn();
    const propsWithSuggestions = {
      ...defaultProps,
      onAcceptSuggestion,
      khongMinhSuggestions: {
        'post1': [mockAffiliateLinks[0]],
      },
    };

    render(<PostDetailModal {...propsWithSuggestions} />);

    // Click accept button
    fireEvent.click(screen.getByText('Accept First'));

    // Check that onAcceptSuggestion was called with the correct product ID
    expect(onAcceptSuggestion).toHaveBeenCalledWith(mockAffiliateLinks[0].id);
  });
});