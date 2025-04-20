'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ScannerComponentProps {
  onScan: (barcode: string) => void;
}

export default function ScannerComponent({ onScan }: ScannerComponentProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader';

  useEffect(() => {
    // Inicializar el escáner
    scannerRef.current = new Html5Qrcode(scannerContainerId);

    // Limpiar al desmontar
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error("Error al detener el escáner:", error);
        });
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        // Llamar a la función de callback con el código escaneado
        onScan(decodedText);
        
        // No detener el escáner para permitir múltiples escaneos
      };
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };
      
      await scannerRef.current.start(
        { facingMode: "environment" }, 
        config, 
        qrCodeSuccessCallback
      );
    } catch (error) {
      console.error("Error al iniciar el escáner:", error);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current || !isScanning) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (error) {
      console.error("Error al detener el escáner:", error);
    }
  };

  useEffect(() => {
    // Iniciar el escáner automáticamente al montar el componente
    startScanner();
    
    // Detener el escáner al desmontar
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div id={scannerContainerId} className="w-full max-w-md h-64 border rounded-md overflow-hidden"></div>
      <p className="text-sm text-muted-foreground text-center">
        Apunte la cámara al código de barras de la sierra para escanearla
      </p>
    </div>
  );
}
