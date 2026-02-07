import { useState, useEffect } from 'react';

interface SlideshowSettingProps {
  currentInterval: string;
  onSave: (interval: string) => void;
}

export function SlideshowSetting({ currentInterval, onSave }: SlideshowSettingProps) {
  const [interval, setInterval] = useState(currentInterval);

  useEffect(() => {
    setInterval(currentInterval);
  }, [currentInterval]);

  return (
    <div className="setting-section">
      <h3>Slideshow</h3>
      <div className="setting-row">
        <label>Interval (seconds):</label>
        <input
          type="number"
          min="1"
          max="60"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="setting-input setting-input-sm"
        />
        <button className="btn btn-primary" onClick={() => onSave(interval)}>
          Save
        </button>
      </div>
    </div>
  );
}
