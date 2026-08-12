import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import Button from './Button';
import Card from './Card';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  title?: string;
}

/**
 * Componente para escanear códigos QR/Barcode.
 * Similar a integrar CameraX en Android.
 */
const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = 'Escanear código',
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isScanning) return;

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (errorMessage) => {
          // Silenciar errores repetitivos
        }
      );

      return () => {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.clear();
        }
      };
    } catch (error) {
      console.error('Error inicializando scanner:', error);
      setIsScanning(false);
    }
  }, [isScanning, onScan]);

  const handleClose = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-4">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          {title}
        </h3>

        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4"
        >
          <div id="qr-reader" className="w-full" />
        </div>

        <Button
          variant="danger"
          fullWidth
          onClick={handleClose}
        >
          ✕ Cerrar
        </Button>
      </Card>
    </div>
  );
};

export default QRScanner;
