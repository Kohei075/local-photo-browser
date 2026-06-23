import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { GridPage } from './pages/GridPage';
import { ViewerPage } from './pages/ViewerPage';
import { SettingsPage } from './pages/SettingsPage';
import { FavoritesPage } from './pages/FavoritesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GridPage />} />
          <Route path="/viewer/:photoId" element={<ViewerPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
