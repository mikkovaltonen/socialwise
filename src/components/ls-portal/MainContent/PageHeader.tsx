/**
 * PageHeader
 *
 * Simple page header with title only
 * Demo version: Single client (Lapsi 1) - no client selection needed
 */

import React from 'react';

export const PageHeader: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900">
        Lastensuojelu ja perheiden palvelut
      </h1>

      {/* Client Info - Static for demo */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Asiakas:</span> Lapsi 1
      </div>
    </div>
  );
};

export default PageHeader;
