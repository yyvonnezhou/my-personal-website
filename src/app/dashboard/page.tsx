import { Metadata } from 'next';
import { Suspense } from 'react';
import FinancialDashboard from './FinancialDashboard';

export const metadata: Metadata = {
  title: 'Financial Dashboard',
  description: 'Interactive financial analysis dashboard with real-time data from SEC filings and company reports.',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <FinancialDashboard />
    </Suspense>
  );
}