import { Link } from 'react-router-dom';
import type { Photo } from '../../types';

interface PhotoCardProps {
  photo: Photo;
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <Link to={`/viewer/${photo.id}`} className="photo-card">
      <div className="photo-card-image">
        <img
          src={photo.thumbnail_url}
          alt={photo.file_name}
          loading="lazy"
        />
        {photo.is_favorite && (
          <span className="photo-card-favorite" title="Favorite">&#9829;</span>
        )}
      </div>
      <div className="photo-card-info">
        <span className="photo-card-name" title={photo.file_name}>{photo.file_name}</span>
      </div>
    </Link>
  );
}
