/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/generated/prisma";
import Link from "next/link";

export function ClientDetail({
  client,
  session,
}: {
  client: Client;
  session: any;
}) {
  return (
    <div className='grid gap-4 md:grid-cols-2 grid-cols-1'>
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Kolom 1 */}
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-muted-foreground'>Name</p>
                <p className='font-medium truncate'>{client.name}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium truncate max-w-[180px]'>
                  {client.email}
                </p>
              </div>
            </div>

            {/* Kolom 2 */}
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-muted-foreground'>Gender</p>
                <p className='font-medium capitalize'>
                  {client.gender.toLowerCase()}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Phone</p>
                <p className='font-medium truncate max-w-[180px]'>
                  {client.phone}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid grid-cols-1 gap-4'>
            <div className='min-w-0'>
              {" "}
              {/* Container dengan min-width 0 untuk memaksa truncate */}
              <p className='text-sm text-muted-foreground'>Company Name</p>
              <p className='font-medium truncate'>{client.companyName}</p>
            </div>

            <div className='min-w-0'>
              <p className='text-sm text-muted-foreground'>Company Email</p>
              <p className='font-medium truncate'>{client.companyEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {client.createdById === session.user.id && (
        <div className='md:col-span-2 flex justify-end gap-2'>
          <Button asChild variant='outline'>
            <Link href='/dashboard/clients'>Back to Clients</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              Edit Client
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
