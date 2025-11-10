/**
 * NavigationMenu
 *
 * Navigation items for LS-portaali sidebar
 */

import React from 'react';
import { User, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavigationMenuProps {
  currentView: 'child-view' | 'all-children' | 'settings';
  onNavigate?: (view: 'child-view' | 'all-children' | 'settings') => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  currentView,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'child-view' as const,
      label: 'Lapsen tarkastelu',
      icon: User,
    },
    {
      id: 'all-children' as const,
      label: 'Kaikki lapset',
      icon: Users,
    },
    {
      id: 'settings' as const,
      label: 'Ylläpito',
      icon: Settings,
      isExternalLink: true, // Navigate to /admin instead of changing view
    },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.isExternalLink && item.id === 'settings') {
      // Navigate to Admin page
      navigate('/admin');
    } else {
      onNavigate?.(item.id);
    }
  };

  return (
    <nav className="space-y-1 px-3">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id && !item.isExternalLink;

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              transition-colors duration-200 text-left
              ${
                isActive
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
