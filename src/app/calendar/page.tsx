
'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { calendarEvents } from '@/lib/data';
import { Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedDayEvents = calendarEvents.filter(event => {
    // This is a simple comparison. A real implementation would parse and compare dates properly.
    return true; 
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Manage your meetings and events."
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <CardTitle>Schedule for {date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today'}</CardTitle>
                <CardDescription>You have {selectedDayEvents.length} events scheduled.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                {selectedDayEvents.map((event, index) => (
                    <li key={event.id}>
                    <div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-muted-foreground w-20">
                        {event.time}
                        </div>
                        <div className="flex-1">
                        <p className="font-semibold">{event.title}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1.5" />
                            <span>{event.duration}</span>
                        </div>
                        </div>
                    </div>
                    {index < selectedDayEvents.length - 1 && <Separator className="mt-4" />}
                    </li>
                ))}
                </ul>
                {selectedDayEvents.length === 0 && (
                    <p className="text-muted-foreground">No events scheduled for this day.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
