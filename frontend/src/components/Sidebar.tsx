import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

interface Props {
  portalLabel: string;
  navItems: NavItem[];
  footer: ReactNode;
  onLogout: () => void;
}

// Shared left-hand navigation menu used by all three portals. Each layout
// (ResidentLayout / AdminLayout / SecurityLayout) supplies its own nav items
// and footer identity block — see the build guide's Phase 4 for why the
// footer exists: it makes every page instantly personal.
export default function Sidebar({ portalLabel, navItems, footer, onLogout }: Props) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo / portal header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-sm font-bold text-white">
          SA
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Student Accommodation</p>
          <p className="text-xs text-brand-500 leading-tight">{portalLabel}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Log out */}
      <button
        onClick={onLogout}
        className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
      >
        <span>↩</span> Log out
      </button>

      {/* Identity footer */}
      <div className="border-t border-gray-200 px-4 py-3">{footer}</div>
    </aside>
  );
}