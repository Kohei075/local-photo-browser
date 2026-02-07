import { PhotoGrid } from '../components/grid/PhotoGrid';
import { SortBar } from '../components/grid/SortBar';
import { FilterBar } from '../components/grid/FilterBar';

export function GridPage() {
  return (
    <div className="grid-page">
      <div className="grid-toolbar">
        <FilterBar />
        <SortBar />
      </div>
      <PhotoGrid />
    </div>
  );
}
