import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardContent from '@/components/smartoffice/DashboardContent';

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('DashboardContent Component', () => {
  const mockInboundEmail = 'test@smartoffice.valorfs.app';

  const mockStatsData = {
    success: true,
    data: {
      totalPolicies: 150,
      totalAgents: 25,
      totalPremium: 500000,
      lastSync: '2024-01-15T10:30:00Z',
      pendingCount: 12,
      thisMonthCount: 45,
      topCarriers: [
        { name: 'Carrier A', count: 50 },
        { name: 'Carrier B', count: 30 },
      ],
    },
  };

  const mockPoliciesData = {
    success: true,
    data: [
      {
        id: 'policy-1',
        policyNumber: 'POL-001',
        primaryAdvisor: 'John Doe',
        productName: 'Term Life Insurance',
        carrierName: 'Carrier A',
        primaryInsured: 'Jane Smith',
        type: 'LIFE',
        status: 'INFORCE',
        commAnnualizedPrem: 5000,
        weightedPremium: 4500,
        statusDate: '2024-01-10',
      },
      {
        id: 'policy-2',
        policyNumber: 'POL-002',
        primaryAdvisor: 'Mary Johnson',
        productName: 'Whole Life',
        carrierName: 'Carrier B',
        primaryInsured: 'Bob Wilson',
        type: 'LIFE',
        status: 'PENDING',
        commAnnualizedPrem: 8000,
        weightedPremium: 7200,
        statusDate: '2024-01-12',
      },
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    },
  };

  const mockAgentsData = {
    success: true,
    data: [
      {
        id: 'agent-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        phones: '555-1234',
        supervisor: 'Jane Manager',
        npn: 'NPN123',
        subSource: 'Direct',
      },
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSearchParams.delete('filter');

    // Default mock responses
    vi.mocked(global.fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/smartoffice/stats')) {
          return Promise.resolve({
            json: async () => mockStatsData,
            ok: true,
          } as Response);
        }
        if (url.includes('/api/smartoffice/policies')) {
          return Promise.resolve({
            json: async () => mockPoliciesData,
            ok: true,
          } as Response);
        }
        if (url.includes('/api/smartoffice/agents')) {
          return Promise.resolve({
            json: async () => mockAgentsData,
            ok: true,
          } as Response);
        }
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render dashboard title', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('SmartOffice Intelligence')).toBeInTheDocument();
      });
    });

    it('should render all stats cards', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('Total Policies')).toBeInTheDocument();
        expect(screen.getByText('Total Agents')).toBeInTheDocument();
        expect(screen.getByText('Total Premium')).toBeInTheDocument();
        expect(screen.getByText('Last Sync')).toBeInTheDocument();
      });
    });

    it('should display correct stats values', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total policies
        expect(screen.getByText('25')).toBeInTheDocument(); // Total agents
      });
    });

    it('should render quick action cards', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('My Policies')).toBeInTheDocument();
        expect(screen.getByText('Pending Cases')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('Top Carriers')).toBeInTheDocument();
      });
    });

    it('should render tabs for policies and agents', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /policies/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /agents/i })).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search policies/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('should format currency correctly', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        // $500,000 formatted
        expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
      });
    });

    it('should format date correctly', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        // Date should be formatted
        const dateElements = screen.queryAllByText(/1\/15\/2024/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display pending count', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        // Should show pending count of 12
        const pendingElements = screen.getAllByText('12');
        expect(pendingElements.length).toBeGreaterThan(0);
      });
    });

    it('should display this month count', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        // Should show this month count of 45
        const monthElements = screen.getAllByText('45');
        expect(monthElements.length).toBeGreaterThan(0);
      });
    });

    it('should display top carrier name', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('Carrier A')).toBeInTheDocument();
      });
    });
  });

  describe('Policies Table', () => {
    it('should render policy table headers', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('Policy #')).toBeInTheDocument();
        expect(screen.getByText('Advisor')).toBeInTheDocument();
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('Carrier')).toBeInTheDocument();
        expect(screen.getByText('Insured')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should render policy data', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('POL-001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Term Life Insurance')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should render multiple policies', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('POL-001')).toBeInTheDocument();
        expect(screen.getByText('POL-002')).toBeInTheDocument();
      });
    });

    it('should display policy status badges', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('INFORCE')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    it('should navigate to policy detail on row click', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('POL-001')).toBeInTheDocument();
      });

      const row = screen.getByText('POL-001').closest('tr');
      if (row) {
        await user.click(row);
        expect(mockPush).toHaveBeenCalledWith('/smartoffice/policies/policy-1');
      }
    });
  });

  describe('Agents Tab', () => {
    it('should switch to agents tab', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /agents/i })).toBeInTheDocument();
      });

      const agentsTab = screen.getByRole('button', { name: /agents/i });
      await user.click(agentsTab);

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
      });
    });

    it('should render agent data when on agents tab', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      const agentsTab = screen.getByRole('button', { name: /agents/i });
      await user.click(agentsTab);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('555-1234')).toBeInTheDocument();
        expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      });
    });

    it('should update search placeholder when switching tabs', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      const agentsTab = screen.getByRole('button', { name: /agents/i });
      await user.click(agentsTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search agents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search term on input', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      const searchInput = screen.getByPlaceholderText(/search policies/i);
      await user.type(searchInput, 'POL-001');

      expect(searchInput).toHaveValue('POL-001');
    });

    it('should trigger search after typing', async () => {
      const user = userEvent.setup();
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      const searchInput = screen.getByPlaceholderText(/search policies/i);

      // Clear initial fetch calls
      vi.clearAllMocks();

      await user.type(searchInput, 'term');

      // Wait for debounce
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('search=term'),
            expect.any(Object)
          );
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Chart Components', () => {
    it('should render chart section title', async () => {
      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('Insights & Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton initially', () => {
      // Mock fetch to delay response
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      // Should show loading animation
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no data', async () => {
      vi.mocked(global.fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/smartoffice/stats')) {
            return Promise.resolve({
              json: async () => ({
                success: true,
                data: {
                  totalPolicies: 0,
                  totalAgents: 0,
                  totalPremium: 0,
                  lastSync: null,
                  pendingCount: 0,
                  thisMonthCount: 0,
                  topCarriers: [],
                },
              }),
              ok: true,
            } as Response);
          }
          if (url.includes('/api/smartoffice/policies')) {
            return Promise.resolve({
              json: async () => ({
                success: true,
                data: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
              }),
              ok: true,
            } as Response);
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(screen.getByText('No Data Yet')).toBeInTheDocument();
      });
    });

    it('should show import button in empty state', async () => {
      vi.mocked(global.fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/smartoffice/stats')) {
            return Promise.resolve({
              json: async () => ({
                success: true,
                data: {
                  totalPolicies: 0,
                  totalAgents: 0,
                  totalPremium: 0,
                  lastSync: null,
                  pendingCount: 0,
                  thisMonthCount: 0,
                  topCarriers: [],
                },
              }),
              ok: true,
            } as Response);
          }
          if (url.includes('/api/smartoffice/policies')) {
            return Promise.resolve({
              json: async () => ({
                success: true,
                data: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
              }),
              ok: true,
            } as Response);
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        const importLinks = screen.getAllByText('Import Data');
        expect(importLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle stats fetch error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(global.fetch).mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/smartoffice/stats')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          json: async () => mockPoliciesData,
          ok: true,
        } as Response);
      });

      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch stats:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle policies fetch error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(global.fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/smartoffice/stats')) {
            return Promise.resolve({
              json: async () => mockStatsData,
              ok: true,
            } as Response);
          }
          if (url.includes('/api/smartoffice/policies')) {
            return Promise.reject(new Error('Network error'));
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<DashboardContent inboundEmailAddress={mockInboundEmail} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch policies:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
