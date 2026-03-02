import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import ProductCard from '../marketplace/ProductCard';

// Mock the cart context
const mockAddToCart = vi.fn();
vi.mock('../../contexts/CartContext', () => ({
    useCart: () => ({
        addToCart: mockAddToCart,
    }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock ImageWithFallback to render a simple img tag for testing
vi.mock('../figma/ImageWithFallback', () => ({
    ImageWithFallback: ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} data-testid="product-image" />
    ),
}));

// Mock ShopInteractionModal (doesn't need to actually render for these tests)
vi.mock('../marketplace/ShopInteractionModal', () => ({
    default: () => <div data-testid="shop-modal" />,
}));

describe('ProductCard Component', () => {
    const defaultProduct = {
        id: '123',
        name: 'Fresh Organic Apples',
        price: 4.99,
        shop: 'Green Valley Farms',
        distance: '2.5 km',
        rating: 4.8,
        imageUrl: 'https://example.com/apple.jpg',
        inStock: true,
        shopPhone: '+1234567890',
        shopLocation: 'Downtown',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders product information correctly', () => {
        render(<ProductCard product={defaultProduct} />);

        // Check basic details
        expect(screen.getByText('Fresh Organic Apples')).toBeInTheDocument();
        expect(screen.getByText('$4.99')).toBeInTheDocument();
        expect(screen.getByText('Green Valley Farms')).toBeInTheDocument();
        expect(screen.getByText('2.5 km')).toBeInTheDocument();

        // Check shop details (phone and location should be rendered)
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
        expect(screen.getByText('Downtown')).toBeInTheDocument();
    });

    it('handles Add to Cart click correctly when in stock', async () => {
        render(<ProductCard product={defaultProduct} />);

        const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
        expect(addToCartBtn).not.toBeDisabled();

        fireEvent.click(addToCartBtn);

        // Verify useCart hook was called
        expect(mockAddToCart).toHaveBeenCalledTimes(1);
        expect(mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({
            productId: '123',
            name: 'Fresh Organic Apples',
            price: 4.99,
        }));

        // Verify it temporarily changes text
        expect(screen.getByText('Added!')).toBeInTheDocument();

        // Wait for timeout to reset text
        await waitFor(() => {
            expect(screen.getByText('Add to Cart')).toBeInTheDocument();
        });
    });

    it('disables Add to Cart button when out of stock', () => {
        const outOfStockProduct = { ...defaultProduct, inStock: false };
        render(<ProductCard product={outOfStockProduct} />);

        const addToCartBtn = screen.getByRole('button', { name: /unavailable/i });
        expect(addToCartBtn).toBeDisabled();

        fireEvent.click(addToCartBtn);
        expect(mockAddToCart).not.toHaveBeenCalled();

        // Should display Out of Stock banner
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('opens chat/reviews modal when interaction buttons are clicked', () => {
        render(<ProductCard product={defaultProduct} />);

        const chatBtn = screen.getByRole('button', { name: /chat/i });
        fireEvent.click(chatBtn);

        // Check if the mock modal is rendered
        expect(screen.getByTestId('shop-modal')).toBeInTheDocument();
    });
});
