import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { FolderSidebar } from '../sidebar/FolderSidebar';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function Layout() {
  const location = useLocation();
  const showSidebar = location.pathname === '/' || location.pathname.startsWith('/viewer') || location.pathname === '/favorites';

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        {showSidebar && <FolderSidebar />}
        <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
