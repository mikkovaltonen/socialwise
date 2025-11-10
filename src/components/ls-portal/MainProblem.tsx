/**
 * MainProblem Component
 * Displays the main problem/concern for the child welfare case
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { MainProblem as MainProblemType } from '@/data/ls-types';

interface MainProblemProps {
  mainProblem: MainProblemType;
}

const severityColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const severityLabels = {
  low: 'Matala',
  medium: 'Keskitaso',
  high: 'Korkea',
  critical: 'Kriittinen',
};

export const MainProblem: React.FC<MainProblemProps> = ({ mainProblem }) => {
  const severityClass = severityColors[mainProblem.severity];
  const severityLabel = severityLabels[mainProblem.severity];

  return (
    <Card className={`border-2 ${severityClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <CardTitle className="text-lg">Pääongelma</CardTitle>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded bg-white/50">
            {severityLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">
              {mainProblem.category}
            </h3>
            <p className="text-sm opacity-90">{mainProblem.description}</p>
          </div>

          {mainProblem.subcategories.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Liittyvät tekijät:</p>
              <div className="flex flex-wrap gap-2">
                {mainProblem.subcategories.map((sub, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded bg-white/70 border border-current"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
