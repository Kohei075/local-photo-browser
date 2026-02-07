import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useTags } from '../hooks/useTags';
import { PersonList } from '../components/people/PersonList';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function PeoplePage() {
  const { personTags } = useAppStore();
  const { fetchTags, updateTag, deleteTag } = useTags();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleClick = (tagId: number) => {
    const { setPersonTagId } = useAppStore.getState();
    setPersonTagId(tagId);
    navigate('/');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this person tag? This will remove it from all photos.')) {
      await deleteTag(id);
    }
  };

  if (!personTags) return <LoadingSpinner />;

  return (
    <div className="people-page">
      <h2>People</h2>
      <PersonList
        tags={personTags}
        onRename={updateTag}
        onDelete={handleDelete}
        onClick={handleClick}
      />
    </div>
  );
}
