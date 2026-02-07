import { PersonCard } from './PersonCard';
import type { PersonTag } from '../../types';

interface PersonListProps {
  tags: PersonTag[];
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
}

export function PersonList({ tags, onRename, onDelete, onClick }: PersonListProps) {
  if (tags.length === 0) {
    return (
      <div className="empty-state">
        <p>No person tags yet. Add tags from the photo viewer.</p>
      </div>
    );
  }

  return (
    <div className="person-list">
      {tags.map((tag) => (
        <PersonCard
          key={tag.id}
          tag={tag}
          onRename={onRename}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
