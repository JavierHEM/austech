'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Barcode, Search, X } from 'lucide-react';

interface AfiladoSearchBarProps {
  onSearch: (codigoBarras: string) => void;
}

export default function AfiladoSearchBar({ onSearch }: AfiladoSearchBarProps) {
  const [codigoBarras, setCodigoBarras] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Enfocar el input al cargar el componente
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = () => {
    if (codigoBarras.trim()) {
      onSearch(codigoBarras.trim());
    }
  };

  const handleClear = () => {
    setCodigoBarras('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <div className="relative flex-1">
        <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          className="pl-10 h-12 text-lg"
          placeholder="Buscar por código de barras de sierra"
          value={codigoBarras}
          onChange={(e) => setCodigoBarras(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {codigoBarras && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <Button 
        onClick={handleSearch} 
        size="lg"
        className="h-12"
      >
        <Search className="h-5 w-5" />
        <span className="ml-2 hidden sm:inline">Buscar</span>
      </Button>
    </div>
  );
}
