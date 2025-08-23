import Fuse from 'fuse.js';

export interface MenuItem {
  id: string;
  name: string;
  size: string;
  price: number;
  isActive: boolean;
  category?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResult {
  item: MenuItem;
  score?: number;
}

const fuseOptions = {
  keys: [
    {
      name: 'name',
      weight: 0.8,
    },
    {
      name: 'size',
      weight: 0.2,
    },
  ],
  threshold: 0.3,
  distance: 100,
  minMatchCharLength: 1,
  includeScore: true,
  shouldSort: true,
};

export class MenuSearchService {
  private fuse: Fuse<MenuItem>;
  
  constructor(items: MenuItem[]) {
    this.fuse = new Fuse(items, fuseOptions);
  }

  search(query: string): MenuItem[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  updateItems(items: MenuItem[]): void {
    this.fuse = new Fuse(items, fuseOptions);
  }
}

// Simple fuzzy matching fallback if Fuse.js is not available
export function simpleSearch(items: MenuItem[], query: string): MenuItem[] {
  if (!query.trim()) {
    return items;
  }

  const searchTerm = query.toLowerCase();
  
  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.size.toLowerCase().includes(searchTerm)
  ).sort((a, b) => {
    // Prioritize exact matches at the beginning of the name
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return a.name.localeCompare(b.name);
  });
}