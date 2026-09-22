import React from 'react';
import { Menu } from 'lucide-react';

import './MobileHeader.css';

import brandLogo from '../../assets/knucles-logo.png';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

function MobileHeader({
  onMenuOpen,
}: MobileHeaderProps): React.ReactElement {
  return (
    <header className="mobile-header">
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu
          size={22}
          strokeWidth={2}
        />
      </button>

      <div className="mobile-brand">
        <div className="mobile-brand-logo">
          <img
            src={brandLogo}
            alt="Knuckles Retreat"
          />
        </div>

        <span className="mobile-brand-name">
          Knuckles Retreat
        </span>
      </div>
    </header>
  );
}

export default MobileHeader;