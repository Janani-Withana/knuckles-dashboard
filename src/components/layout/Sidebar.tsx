import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, X } from "lucide-react";

import type { MenuItem } from "../../types/dashboard";
import brandLogo from "../../assets/knucles-logo.png";
//import hmsLogo from "../../assets/kudah-logo.png";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const BRANDING = {
  SuperAdmin: {
    logo: brandLogo,
    name: "HMS Admin",
    tagline: "-PLATFORM CONSOLE-",
    footer: ["HMS Platform", "Hotel Management System", "v1.0.0"],
  },
  PropertyAdmin: {
    logo: brandLogo,
    name: "Knuckles Retreat",
    tagline: "-RECONNECT WITH NATURE-",
    footer: ["Knuckles Retreat", "Hotel Management System", "v1.0.0"],
  },
} as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  menuItems: MenuItem[];
}

export default function Sidebar({
  isOpen,
  onClose,
  onSignOut,
  menuItems,
}: SidebarProps): React.ReactElement {
  const { user } = useAuth();
  const brand = BRANDING[user?.role ?? "PropertyAdmin"];
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = (label: string) => {
    setOpenMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <div className="sidebar-logo">
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <div className="brand-logo">
          <img src={brand.logo} alt={brand.name} />
        </div>
        <div className="brand-name">{brand.name}</div>
        <div className="brand-tagline">{brand.tagline}</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const menuIsOpen = openMenus.includes(item.label);
          const isActive = item.path ? location.pathname === item.path : false;

          return (
            <div className="nav-group" key={item.label}>
              <button
                type="button"
                className={`nav-item ${isActive ? "active" : ""} ${menuIsOpen ? "open" : ""}`}
                onClick={() => {
                  if (hasChildren) toggleMenu(item.label);
                  else if (item.path) goTo(item.path);
                }}
              >
                <Icon size={21} strokeWidth={1.8} />
                <span>{item.label}</span>
                {hasChildren && (
                  <ChevronRight className="nav-arrow" size={17} />
                )}
              </button>

              {hasChildren && menuIsOpen && (
                <div className="nav-children">
                  {item.children?.map((child) => (
                    <button
                      type="button"
                      key={child.path}
                      className={`nav-child ${location.pathname === child.path ? "active" : ""}`}
                      onClick={() => goTo(child.path)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button type="button" className="sidebar-signout" onClick={onSignOut}>
        <LogOut size={18} strokeWidth={1.8} />
        <span>Sign Out</span>
      </button>

      <div className="sidebar-footer">
        {brand.footer.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

    </aside>
  );
}
