import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import Root from '../Root';

// Mock contexts and router dependencies
vi.mock('react-router', () => ({
    Outlet: () => <div data-testid="outlet-mock" />,
    useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}));

vi.mock('../navigation/Navigation', () => ({
    default: () => <nav data-testid="navigation-mock" />,
}));

// Mock API calls
vi.mock('../../services/api', () => ({
    api: {
        getAuthToken: vi.fn(),
        getCurrentUser: vi.fn().mockResolvedValue({ credits: 100 }),
    },
}));

// We only want to ensure Root renders without crashing and mounts contexts properly
describe('Root Layout Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        // Partially mock matchMedia for JSDOM
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // deprecated
                removeListener: vi.fn(), // deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        // Partially mock navigator.geolocation to prevent errors during the effect
        const mockGeolocation = {
            getCurrentPosition: vi.fn(),
            watchPosition: vi.fn()
        };

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        global.navigator.geolocation = mockGeolocation;
    });

    it('renders Navigation and Outlet successfully in context tree', () => {
        render(<Root />);

        // The Navigation component should be visible
        expect(screen.getByTestId('navigation-mock')).toBeInTheDocument();

        // The Router's generic Outlet should be rendered for child pages
        expect(screen.getByTestId('outlet-mock')).toBeInTheDocument();
    });
});
