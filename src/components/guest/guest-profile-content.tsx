"use client";

import { useGuestAuth } from "@/context/auth-guest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Mail, User } from "lucide-react";

export default function GuestProfileContent() {
  const { client, isLoading } = useGuestAuth();

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold'>Client Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-48' />
                  <Skeleton className='h-3 w-72' />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-2xl font-bold text-gray-800'>Not Authenticated</h1>
        <p className='text-gray-600 mt-2'>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Client Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start gap-3'>
            <User className='h-5 w-5 text-muted-foreground mt-0.5' />
            <div>
              <h3 className='font-medium'>Name</h3>
              <p className='text-muted-foreground'>{client.name}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Mail className='h-5 w-5 text-muted-foreground mt-0.5' />
            <div>
              <h3 className='font-medium'>Email</h3>
              <p className='text-muted-foreground'>{client.email}</p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <Building className='h-5 w-5 text-muted-foreground mt-0.5' />
            <div>
              <h3 className='font-medium'>Company</h3>
              <p className='text-muted-foreground'>{client.companyName}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Mail className='h-5 w-5 text-muted-foreground mt-0.5' />
            <div>
              <h3 className='font-medium'>Company Email</h3>
              <p className='text-muted-foreground'>{client.companyEmail}</p>
            </div>
          </div>
          {client.companyAddress && (
            <div className='flex items-start gap-3'>
              <Building className='h-5 w-5 text-muted-foreground mt-0.5' />
              <div>
                <h3 className='font-medium'>Company Address</h3>
                <p className='text-muted-foreground'>{client.companyAddress}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
