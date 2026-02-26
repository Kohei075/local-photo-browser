import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.gallery') },
    { path: '/settings', label: t('nav.settings') },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">Local Photo Browser</Link>
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
