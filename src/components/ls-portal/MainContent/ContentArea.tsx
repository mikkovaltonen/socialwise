/**
 * ContentArea
 *
 * Main content wrapper with scrollable area for case information cards
 * Demo version: Single client (Lapsi 1) - no client selection
 */

import React from 'react';
import { PageHeader } from './PageHeader';

interface ContentAreaProps {
  children: React.ReactNode;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-10 space-y-8">
        {/* Page Header */}
        <PageHeader />

        {/* Content Cards */}
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
};

export default ContentArea;
