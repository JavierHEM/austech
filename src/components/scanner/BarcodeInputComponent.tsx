'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Barcode } from 'lucide-react';

interface BarcodeInputComponentProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
}

export default function BarcodeInputComponent({ 
  onScan, 
  placeholder = 'Escanee o ingrese el código de barras'
}: BarcodeInputComponentProps) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input al montar el componente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // La pistola lectora generalmente envía un Enter después de escanear
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcode.trim()) {
        onScan(barcode.trim());
        setBarcode('');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Barcode className="mr-2 h-5 w-5" />
          Escáner de Códigos de Barras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
            autoComplete="off"
            autoFocus
          />
          <Button type="button" onClick={handleSubmit}>Procesar</Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Use la pistola lectora para escanear el código de barras o ingréselo manualmente y presione Enter
        </p>
      </CardContent>
    </Card>
  );
}
