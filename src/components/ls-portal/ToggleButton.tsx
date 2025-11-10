/**
 * ToggleButton
 *
 * VS Code-style toggle button for panels
 */

import React from 'react';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';

interface ToggleButtonProps {
  position: 'left' | 'right';
  isVisible: boolean;
  onToggle: () => void;
  label?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  position,
  isVisible,
  onToggle,
  label,
}) => {
  const Icon = position === 'left' ? PanelLeftClose : PanelRightClose;

  if (position === 'left') {
    // Left panel toggle - show when panel is hidden
    return !isVisible ? (
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50
                   bg-ls-blue hover:bg-ls-blue-dark
                   text-white p-2 rounded-r-lg shadow-lg
                   transition-all duration-200"
        title={label || 'Näytä valikko'}
      >
        <PanelLeftClose className="w-5 h-5 rotate-180" />
      </button>
    ) : null;
  }

  // Right panel toggle - always visible when panel is shown
  return isVisible ? (
    <button
      onClick={onToggle}
      className="absolute right-2 top-2 z-10
                 bg-gray-100 hover:bg-gray-200
                 text-gray-600 p-1.5 rounded
                 transition-colors duration-200"
      title={label || 'Piilota paneeli'}
    >
      <Icon className="w-4 h-4" />
    </button>
  ) : null;
};

export default ToggleButton;
