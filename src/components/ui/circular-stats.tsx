import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CreditCard } from 'lucide-react';

interface CircularStatsProps {
  title: string;
  type: 'distribution' | 'paiement';
  data: {
    total: number;
    enCours: number;
    complete: number;
    annule: number;
  };
  loading?: boolean;
}

export function CircularStats({ title, type, data, loading = false }: CircularStatsProps) {
  // Calculate the main metric based on type
  const mainValue = type === 'distribution' ? data.complete : data.complete;
  const mainLabel = type === 'distribution' ? 'Brouillon' : 'Payé';

  // Colors for the chart
  const colors = {
    distribution: {
      primary: '#6366f1', // Indigo for distribution
      secondary: '#e0e7ff', // Light indigo background
    },
    paiement: {
      primary: '#06b6d4', // Cyan for payment
      secondary: '#cffafe', // Light cyan background
    }
  };

  // Calculate percentage for the circular progress
  const percentage = data.total > 0 ? (mainValue / data.total) * 100 : 0;
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Icon based on type
  const Icon = type === 'distribution' ? FileText : CreditCard;
  const iconColor = type === 'distribution' ? 'text-indigo-500' : 'text-cyan-500';

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title} ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center relative">
        <div className="relative w-48 h-48">
          {/* SVG Circular Progress */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={colors[type].secondary}
              strokeWidth="20"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={colors[type].primary}
              strokeWidth="20"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {mainLabel}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {mainValue}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
