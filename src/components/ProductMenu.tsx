import React, { useState, useEffect, useMemo } from 'react';
import ProductItem from './ProductItem';
import { networkAdapter } from '../network/NetworkAdapter';
import { MenuSearchService, simpleSearch, MenuItem } from '../utils/searchUtils';

interface ProductMenuProps {
  searchKey: string;
  onSelect: (product: MenuItem) => void;
}

const ProductMenu: React.FC<ProductMenuProps> = ({ searchKey, onSelect }) => {
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize search service with memoization
    const searchService = useMemo(() => {
        return products.length > 0 ? new MenuSearchService(products) : null;
    }, [products]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await networkAdapter.get('/menu_items');
                if (response && response.data && response.data.menu_items) {
                    setProducts(response.data.menu_items);
                    setError(null);
                } else if (response && response.menu_items) {
                    // Fallback for old response format
                    setProducts(response.menu_items);
                    setError(null);
                } else {
                    setError('Failed to fetch products');
                }
            } catch (error: any) {
                setError(error.message || 'Failed to load menu items');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Filter and search products with performance optimization
    const filteredProducts = useMemo(() => {
        if (!searchKey.trim()) {
            return products.filter(product => product.isActive);
        }

        // Use fuzzy search service if available, fallback to simple search
        const activeProducts = products.filter(product => product.isActive);
        
        if (searchService) {
            // Update search service with active products only
            const activeSearchService = new MenuSearchService(activeProducts);
            return activeSearchService.search(searchKey);
        } else {
            return simpleSearch(activeProducts, searchKey);
        }
    }, [products, searchKey, searchService]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading menu items...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-red-600">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="font-semibold">Error loading menu</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (filteredProducts.length === 0 && searchKey) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-semibold">No results found</p>
                    <p className="text-sm">Try a different search term</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-2">
            <div className="grid grid-cols-4 gap-4 pb-3">
                {filteredProducts.map((product) => (
                    <ProductItem 
                        key={product.id || product.name} 
                        product={product} 
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProductMenu; 