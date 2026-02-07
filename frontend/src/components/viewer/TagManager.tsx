import { useState, useEffect } from 'react';
import { useTags } from '../../hooks/useTags';
import { useAppStore } from '../../stores/appStore';
import type { Photo } from '../../types';

interface TagManagerProps {
  photo: Photo;
  onUpdate: () => void;
}

export function TagManager({ photo, onUpdate }: TagManagerProps) {
  const { personTags } = useAppStore();
  const { fetchTags, createTag, addTagToPhoto, removeTagFromPhoto } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAddTag = async (tagId: number) => {
    await addTagToPhoto(photo.id, tagId);
    onUpdate();
  };

  const handleRemoveTag = async (tagId: number) => {
    await removeTagFromPhoto(photo.id, tagId);
    onUpdate();
  };

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim());
    setNewTagName('');
    // Fetch updated tags, then find and add the new one
    await fetchTags();
  };

  const assignedIds = new Set(photo.person_tags.map((t) => t.id));
  const unassignedTags = personTags.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="tag-manager">
      <div className="tag-badges">
        {photo.person_tags.map((tag) => (
          <span key={tag.id} className="tag-badge">
            {tag.name}
            <button onClick={() => handleRemoveTag(tag.id)} title="Remove tag">✕</button>
          </span>
        ))}
        <button className="tag-add-btn" onClick={() => setIsOpen(!isOpen)}>
          + Tag
        </button>
      </div>

      {isOpen && (
        <div className="tag-dropdown">
          {unassignedTags.length > 0 && (
            <div className="tag-dropdown-list">
              {unassignedTags.map((tag) => (
                <button key={tag.id} onClick={() => handleAddTag(tag.id)}>
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          <div className="tag-create">
            <input
              type="text"
              placeholder="New person name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAndAdd();
              }}
            />
            <button onClick={handleCreateAndAdd} disabled={!newTagName.trim()}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
