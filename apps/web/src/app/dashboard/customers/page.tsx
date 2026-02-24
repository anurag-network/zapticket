'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { 
  Search, Plus, Mail, Phone, Building, 
  TrendingUp, TrendingDown, Minus, ChevronRight
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  healthScore: number;
  totalTickets: number;
  openTickets: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const url = searchQuery 
          ? `/api/customers/search?q=${encodeURIComponent(searchQuery)}`
          : '/api/customers/search?q=';
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCustomers, searchQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage and view customer information</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : customers.length > 0 ? (
          customers.map((customer) => (
            <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {customer.name?.[0] || customer.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {customer.name || 'Unknown'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                      </div>
                    </div>
                    <Badge className={getHealthBadge(customer.healthScore)}>
                      {customer.healthScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Tickets</p>
                      <p className="font-medium">{customer.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Open</p>
                      <p className="font-medium">{customer.openTickets}</p>
                    </div>
                  </div>
                  {customer.company && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {customer.company}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
