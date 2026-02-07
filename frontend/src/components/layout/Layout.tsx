import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { FolderSidebar } from '../sidebar/FolderSidebar';

export function Layout() {
  const location = useLocation();
  const showSidebar = location.pathname === '/' || location.pathname.startsWith('/viewer');

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        {showSidebar && <FolderSidebar />}
        <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
