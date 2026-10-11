import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import OverviewContent from '@/components/dashboard/OverviewContent';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <OverviewContent user={session.user} />;
}
