/**
 * UserProfile
 *
 * User profile section at bottom of left sidebar
 * Shows user name and logout button
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Extract first name from email or display name
  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      // Extract name before @ in email
      const emailName = user.email.split('@')[0];
      // Capitalize first letter
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Käyttäjä';
  };

  return (
    <div className="space-y-3">
      {/* User Name */}
      <div className="text-center">
        <p className="text-xs text-white/60 mb-1">Kirjautuneena:</p>
        <p className="text-sm font-medium text-white">{getUserDisplayName()}</p>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                   bg-ls-coral hover:bg-ls-coral/90
                   text-white rounded-lg transition-colors duration-200
                   font-medium text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Kirjaudu ulos</span>
      </button>
    </div>
  );
};

export default UserProfile;
