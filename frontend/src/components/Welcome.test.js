import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Welcome from './Welcome';

// Mock fetch
global.fetch = jest.fn();

describe('Welcome Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should fetch and display JWT token', async () => {
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com',
      provider: 'google'
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    // Mock successful fetch responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken })
      });

    render(
      <BrowserRouter>
        <Welcome />
      </BrowserRouter>
    );

    // Wait for JWT to be displayed
    await waitFor(() => {
      expect(screen.getByText(/JWT Token/i)).toBeInTheDocument();
    });

    // Check that token is displayed
    const tokenElement = screen.getByText(new RegExp(mockToken.substring(0, 20)));
    expect(tokenElement).toBeInTheDocument();
  });

  test('should have a button to copy JWT to clipboard', async () => {
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com',
      provider: 'google'
    };

    const mockToken = 'test-jwt-token';

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken })
      });

    render(
      <BrowserRouter>
        <Welcome />
      </BrowserRouter>
    );

    // Wait for copy button to appear
    await waitFor(() => {
      const copyButton = screen.getByText(/Copy/i);
      expect(copyButton).toBeInTheDocument();
    });
  });
});
