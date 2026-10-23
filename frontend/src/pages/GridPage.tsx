import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { PhotoGrid } from '../components/grid/PhotoGrid';
import { SortBar } from '../components/grid/SortBar';
import { FilterBar } from '../components/grid/FilterBar';
import { DeletePhotosButton } from '../components/grid/DeletePhotosButton';

export function GridPage() {
  useEffect(() => () => useAppStore.getState().setDeleteMode(false), []);

  return (
    <div className="grid-page">
      <div className="grid-toolbar-sticky">
        <div className="grid-toolbar">
          <div className="grid-toolbar-controls">
            <FilterBar />
            <SortBar />
          </div>
          <DeletePhotosButton />
        </div>
      </div>
      <PhotoGrid />
    </div>
  );
}
