import React from 'react';
import {
  Search,
  FileText
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface FunctionUsage {
  searchSupplier?: boolean;
  createPurchaseRequisition?: boolean;
}

interface FunctionUsageIndicatorProps {
  functionsUsed: FunctionUsage;
}

const FunctionUsageIndicator: React.FC<FunctionUsageIndicatorProps> = ({ functionsUsed }) => {
  const icons = [
    {
      key: 'searchSupplier',
      Icon: Search,
      label: 'Supplier Search (search_suppliers)',
      color: 'text-purple-500'
    },
    {
      key: 'createPurchaseRequisition',
      Icon: FileText,
      label: 'Create Purchase Requisition',
      color: 'text-green-500'
    }
  ];

  const activeIcons = icons.filter(icon => functionsUsed[icon.key as keyof FunctionUsage]);

  if (activeIcons.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Functions used:</span>
        <div className="flex items-center gap-1.5">
          {activeIcons.map(({ key, Icon, label, color }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-help ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FunctionUsageIndicator;