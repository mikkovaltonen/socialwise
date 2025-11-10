/**
 * ServicePlans Component
 * Displays service plans (Asiakassuunnitelmat)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ServicePlan } from '@/data/ls-types';

interface ServicePlansProps {
  servicePlans: ServicePlan[];
}

const statusLabels: Record<ServicePlan['status'], string> = {
  active: 'Aktiivinen',
  completed: 'Päättynyt',
  cancelled: 'Peruutettu',
};

const statusIcons: Record<ServicePlan['status'], React.ReactNode> = {
  active: <Clock className="h-4 w-4 text-green-600" />,
  completed: <CheckCircle className="h-4 w-4 text-blue-600" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-600" />,
};

const statusColors: Record<ServicePlan['status'], string> = {
  active: 'bg-green-50 border-green-200',
  completed: 'bg-blue-50 border-blue-200',
  cancelled: 'bg-gray-50 border-gray-200',
};

export const ServicePlans: React.FC<ServicePlansProps> = ({ servicePlans }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  // Sort: active first, then by start date descending
  const sortedPlans = [...servicePlans].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Asiakassuunnitelmat</CardTitle>
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
            {servicePlans.length} kpl
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {sortedPlans.map((plan) => {
              const statusLabel = statusLabels[plan.status];
              const statusIcon = statusIcons[plan.status];
              const statusColor = statusColors[plan.status];

              return (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-3 ${statusColor}`}
                >
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcon}
                    <span className="text-xs font-semibold text-gray-700">
                      {statusLabel}
                    </span>
                  </div>

                  {/* Service Type */}
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">
                    {plan.serviceType}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-2">{plan.description}</p>

                  {/* Dates */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Alkanut: {formatDate(plan.startDate)}</span>
                    {plan.endDate && (
                      <span>Päättynyt: {formatDate(plan.endDate)}</span>
                    )}
                  </div>

                  {/* Goals */}
                  {plan.goals && plan.goals.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Tavoitteet:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {plan.goals.map((goal, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outcomes */}
                  {plan.outcomes && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Tulokset:
                      </p>
                      <p className="text-xs text-gray-600">{plan.outcomes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
