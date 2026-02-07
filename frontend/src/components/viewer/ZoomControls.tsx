interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomOut} title="Zoom Out">-</button>
      <span className="zoom-level">{Math.round(scale * 100)}%</span>
      <button onClick={onZoomIn} title="Zoom In">+</button>
      <button onClick={onReset} title="Reset Zoom">Fit</button>
    </div>
  );
}
