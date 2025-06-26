import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Package, Building2, Truck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate, useLocation } from 'react-router-dom';
import { Client, Colis, Entreprise, User as Livreur } from '@/types';

interface SearchResults {
  clients: Client[];
  colis: (Colis & { client?: { nom: string }; entreprise?: { nom: string } })[];
  entreprises: Entreprise[];
  livreurs: Livreur[];
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function GlobalSearch({
  className = "",
  placeholder = "Rechercher clients, colis, entreprises, livreurs...",
  isMobile = false,
  onClose
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ clients: [], colis: [], entreprises: [], livreurs: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Clear search when component mounts or when location changes
  useEffect(() => {
    setQuery('');
    setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  // Clear search when location changes (navigation)
  useEffect(() => {
    setQuery('');
    setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [location.pathname]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await api.globalSearch(searchQuery, 5);

      if (searchResults.error) {
        setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
      } else {
        setResults({
          clients: searchResults.clients,
          colis: searchResults.colis,
          entreprises: searchResults.entreprises,
          livreurs: searchResults.livreurs
        });
        // Ensure dropdown is open when we have results
        setIsOpen(true);
      }
    } catch (error) {
      setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
      setIsOpen(true);
    } else {
      setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
      setIsOpen(false);
    }
  }, [debouncedQuery, performSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length >= 2) {
      setIsLoading(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle input focus - show results if there's existing text
  const handleInputFocus = () => {
    if (query.trim().length >= 2) {
      // If we have existing results, show them immediately
      const hasExistingResults = results.clients.length > 0 || results.colis.length > 0 || results.entreprises.length > 0 || results.livreurs.length > 0;
      if (hasExistingResults) {
        setIsOpen(true);
      } else {
        // If no existing results, trigger a new search
        performSearch(query.trim());
      }
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults({ clients: [], colis: [], entreprises: [], livreurs: [] });
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Navigate to result
  const navigateToResult = (type: 'client' | 'colis' | 'entreprise' | 'livreur', id: string) => {
    closeDropdown();
    setQuery('');

    switch (type) {
      case 'client':
        navigate(`/clients/${id}`);
        break;
      case 'colis':
        navigate(`/colis/${id}`);
        break;
      case 'entreprise':
        navigate(`/entreprises/${id}`);
        break;
      case 'livreur':
        navigate(`/livreurs/${id}`);
        break;
    }
  };

  // Get all results as flat array for keyboard navigation
  const getAllResults = () => {
    const allResults: Array<{ type: 'client' | 'colis' | 'entreprise' | 'livreur'; item: any; index: number }> = [];
    let index = 0;

    results.clients.forEach(client => {
      allResults.push({ type: 'client', item: client, index: index++ });
    });

    results.colis.forEach(colis => {
      allResults.push({ type: 'colis', item: colis, index: index++ });
    });

    results.entreprises.forEach(entreprise => {
      allResults.push({ type: 'entreprise', item: entreprise, index: index++ });
    });

    results.livreurs.forEach(livreur => {
      allResults.push({ type: 'livreur', item: livreur, index: index++ });
    });

    return allResults;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allResults = getAllResults();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const selected = allResults[selectedIndex];
          navigateToResult(selected.type, selected.item.id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate total results
  const totalResults = results.clients.length + results.colis.length + results.entreprises.length + results.livreurs.length;
  const hasResults = totalResults > 0;
  const showNoResults = !isLoading && query.trim().length >= 2 && !hasResults;



  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
        <Input
          key={location.pathname} // Force re-render on navigation
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`pl-10 ${query ? 'pr-10' : 'pr-4'} py-2 w-full bg-white dark:bg-[hsl(222.2,84%,4.9%)] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${isMobile ? 'py-3' : ''}`}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          name={`global-search-${Date.now()}`}
          id={`global-search-${location.pathname.replace(/\//g, '-')}`}
          data-lpignore="true"
          data-form-type="other"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Recherche en cours...</p>
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun résultat trouvé pour "{query}"
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && hasResults && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                Résultats de recherche
              </div>

              {/* Clients Section */}
              {results.clients.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                    <User className="inline h-3 w-3 mr-1" />
                    Clients ({results.clients.length})
                  </div>
                  {results.clients.map((client, index) => {
                    const globalIndex = index;
                    return (
                      <button
                        key={client.id}
                        onClick={() => navigateToResult('client', client.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {client.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {client.email && <span>{client.email}</span>}
                          {client.email && client.telephone && <span> • </span>}
                          {client.telephone && <span>{client.telephone}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Colis Section */}
              {results.colis.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                    <Package className="inline h-3 w-3 mr-1" />
                    Colis ({results.colis.length})
                  </div>
                  {results.colis.map((colis, index) => {
                    const globalIndex = results.clients.length + index;
                    return (
                      <button
                        key={colis.id}
                        onClick={() => navigateToResult('colis', colis.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            Colis #{colis.id}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {colis.statut}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {colis.client?.nom && <span>Client: {colis.client.nom}</span>}
                          {colis.client?.nom && colis.prix && <span> • </span>}
                          {colis.prix && <span>{colis.prix}€</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Entreprises Section */}
              {results.entreprises.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                    <Building2 className="inline h-3 w-3 mr-1" />
                    Entreprises ({results.entreprises.length})
                  </div>
                  {results.entreprises.map((entreprise, index) => {
                    const globalIndex = results.clients.length + results.colis.length + index;
                    return (
                      <button
                        key={entreprise.id}
                        onClick={() => navigateToResult('entreprise', entreprise.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {entreprise.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {entreprise.contact && <span>{entreprise.contact}</span>}
                          {entreprise.contact && entreprise.telephone && <span> • </span>}
                          {entreprise.telephone && <span>{entreprise.telephone}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Livreurs Section */}
              {results.livreurs.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                    <Truck className="inline h-3 w-3 mr-1" />
                    Livreurs ({results.livreurs.length})
                  </div>
                  {results.livreurs.map((livreur, index) => {
                    const globalIndex = results.clients.length + results.colis.length + results.entreprises.length + index;
                    return (
                      <button
                        key={livreur.id}
                        onClick={() => navigateToResult('livreur', livreur.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {livreur.nom} {livreur.prenom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {livreur.telephone && <span>{livreur.telephone}</span>}
                          {livreur.telephone && livreur.statut && <span> • </span>}
                          {livreur.statut && <span>{livreur.statut}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}