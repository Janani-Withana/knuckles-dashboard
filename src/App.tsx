import React, {
  useEffect,
  useState,
} from 'react';

import Sidebar from './components/layout/Sidebar';
import MobileHeader from './components/layout/MobileHeader';
import DashboardScreen from './screens/Dashboard/DashboardScreen';

import './App.css';

function App(): React.ReactElement {
  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen ? 'hidden' : '';

    const onResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      'resize',
      onResize,
    );

    return () => {
      document.body.style.overflow = '';

      window.removeEventListener(
        'resize',
        onResize,
      );
    };
  }, [menuOpen]);

  return (
    <div
      className={`app${menuOpen ? ' menu-open' : ''
        }`}
    >
      {/* Mobile Header */}

      <MobileHeader
        onMenuOpen={() => setMenuOpen(true)}
      />

      {/* Mobile backdrop */}

      <button
        type="button"
        className={`sidebar-backdrop${menuOpen ? ' visible' : ''
          }`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close menu"
      />

      {/* Sidebar */}

      <Sidebar
        isOpen={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />

      {/* Main */}

      <main className="main">
        <div className="content">
          <DashboardScreen />
        </div>
      </main>
    </div>
  );
}

export default App;