import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';

interface ScanButtonProps {
  onStartScan: () => Promise<void>;
  onPollStatus: () => Promise<{ is_scanning: boolean }>;
}

export function ScanButton({ onStartScan, onPollStatus }: ScanButtonProps) {
  const { scanStatus } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const pollRef = useRef<number | null>(null);

  const handleScan = async () => {
    await onStartScan();
    setScanning(true);
  };

  useEffect(() => {
    if (scanning) {
      pollRef.current = window.setInterval(async () => {
        const status = await onPollStatus();
        if (!status.is_scanning) {
          setScanning(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 1000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scanning, onPollStatus]);

  const isScanning = scanning || scanStatus?.is_scanning;

  return (
    <div className="setting-section">
      <h3>Scan Photos</h3>
      <button
        className="btn btn-primary"
        onClick={handleScan}
        disabled={!!isScanning}
      >
        {isScanning ? 'Scanning...' : 'Start Scan'}
      </button>

      {isScanning && scanStatus && (
        <div className="scan-progress">
          <div className="scan-progress-bar">
            <div
              className="scan-progress-fill"
              style={{
                width: scanStatus.total > 0
                  ? `${(scanStatus.processed / scanStatus.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <p className="scan-progress-text">
            {scanStatus.processed} / {scanStatus.total} files processed
          </p>
          {scanStatus.current_file && (
            <p className="scan-current-file">{scanStatus.current_file}</p>
          )}
        </div>
      )}

      {scanStatus?.error && (
        <p className="error-text">{scanStatus.error}</p>
      )}

      {!isScanning && scanStatus && !scanStatus.error && scanStatus.total > 0 && (
        <p className="success-text">
          Scan complete: {scanStatus.total} files processed.
        </p>
      )}
    </div>
  );
}
