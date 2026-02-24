'use client';

import { useParams } from 'next/navigation';
import { Customer360View } from '@/components/customer-360/Customer360View';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  if (!customerId) {
    return <div>Customer ID required</div>;
  }

  return <Customer360View customerId={customerId} />;
}
