import { useState } from 'react';
import type { PersonTag } from '../../types';

interface PersonCardProps {
  tag: PersonTag;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
}

export function PersonCard({ tag, onRename, onDelete, onClick }: PersonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);

  const handleSave = () => {
    if (editName.trim() && editName.trim() !== tag.name) {
      onRename(tag.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="person-card">
      {isEditing ? (
        <div className="person-card-edit">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="person-card-info" onClick={() => onClick(tag.id)}>
            <h3>{tag.name}</h3>
            <p>{tag.photo_count} photos</p>
          </div>
          <div className="person-card-actions">
            <button onClick={() => { setEditName(tag.name); setIsEditing(true); }} title="Rename">
              &#9998;
            </button>
            <button onClick={() => onDelete(tag.id)} title="Delete">
              &#128465;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
