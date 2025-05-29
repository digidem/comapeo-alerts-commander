
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  recentSearches: string[];
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSearch: () => void;
  onClearSearch: () => void;
  onRecentSearchClick: (search: string) => void;
}

export const SearchBar = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  recentSearches,
  searchInputRef,
  onSearch,
  onClearSearch,
  onRecentSearchClick
}: SearchBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-20 left-4 right-4 z-10 md:left-6 md:right-auto md:w-80">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <Input
            ref={searchInputRef}
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="border-none shadow-none focus-visible:ring-0 text-base h-12"
            autoComplete="off"
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearSearch}
              className="p-2 h-8 w-8"
              aria-label="Clear search"
            >
              ✕
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={onSearch} 
            disabled={isSearching || !searchQuery.trim()}
            className="flex-shrink-0 h-12 px-6"
          >
            {isSearching ? '...' : t('common.go')}
          </Button>
        </div>
        
        {/* Recent searches */}
        {recentSearches.length > 0 && !searchQuery && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">{t('map.recentSearches')}</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => onRecentSearchClick(search)}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors min-h-[32px]"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          {t('map.searchTip')}
        </p>
      </div>
    </div>
  );
};
