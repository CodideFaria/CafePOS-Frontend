/** @jsxImportSource react */
import React, { useState, useCallback } from 'react';
import useDebounce from '../hooks/useDebounce';

interface ProductSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  onSearch, 
  placeholder = "Search menu items...",
  debounceMs = 300 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  // Effect to call onSearch when debounced term changes
  React.useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <div className="flex px-2 flex-row relative">
      <div className="absolute left-5 top-3 px-2 py-2 rounded-full bg-orange-500 text-white z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      
      <input 
        type="text" 
        value={searchTerm}
        onChange={handleInputChange}
        className="bg-white rounded-3xl shadow text-lg full w-full h-16 py-4 pl-16 pr-12 transition-shadow focus:shadow-2xl focus:outline-none" 
        placeholder={placeholder}
        aria-label="Search menu items"
      />
      
      {searchTerm && (
        <button
          onClick={handleClearSearch}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ProductSearch;