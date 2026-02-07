import type { Photo } from '../../types';

interface FavoriteButtonProps {
  photo: Photo;
  onToggle: () => void;
}

export function FavoriteButton({ photo, onToggle }: FavoriteButtonProps) {
  return (
    <button
      className={`favorite-btn ${photo.is_favorite ? 'active' : ''}`}
      onClick={onToggle}
      title={photo.is_favorite ? 'Remove from Favorites (F)' : 'Add to Favorites (F)'}
    >
      {photo.is_favorite ? '♥' : '♡'}
    </button>
  );
}
