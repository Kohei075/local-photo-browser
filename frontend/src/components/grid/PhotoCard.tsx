import { Link } from 'react-router-dom';
import type { Photo } from '../../types';

interface PhotoCardProps {
  photo: Photo;
}

export function PhotoCard({ photo }: PhotoCardProps) {
  const sep = photo.file_path.includes('/') ? '/' : '\\';
  const parts = photo.file_path.split(sep);
  const parentFolder = parts.length >= 2 ? parts[parts.length - 2] : '';
  const displayPath = parentFolder ? `${parentFolder}/${photo.file_name}` : photo.file_name;

  return (
    <Link to={`/viewer/${photo.id}`} className="photo-card">
      <div className="photo-card-image">
        <img
          src={photo.thumbnail_url}
          alt={photo.file_name}
          loading="lazy"
        />
      </div>
      <div className="photo-card-info">
        <span className="photo-card-name" title={displayPath}>
          {parentFolder && <span className="photo-card-folder">{parentFolder}/</span>}
          <span className="photo-card-filename">{photo.file_name}</span>
        </span>
      </div>
    </Link>
  );
}
