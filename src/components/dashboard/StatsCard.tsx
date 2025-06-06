import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatsCardProps) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-card overflow-hidden', className)}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          {icon && (
            <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
              {icon}
            </div>
          )}
        </div>
        
        {(description || trend) && (
          <div className="mt-3 flex items-center">
            {trend && (
              <div 
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mr-2',
                  trend.isPositive ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                )}
              >
                <span>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
