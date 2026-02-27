
'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { calendarEvents } from '@/lib/data';
import { Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthEvents, setMonthEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthEvents = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        // Fallback or empty if no token
        setMonthEvents([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch for the whole month
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

        const googleEvents = await fetchGoogleCalendarEvents(token, startOfMonth, endOfMonth);
        setMonthEvents(googleEvents);

      } catch (err: any) {
        const errorMessage = err.message || "Unknown error";

        // Only log unexpected errors to the console
        if (!errorMessage.includes('401') && !errorMessage.includes('Invalid Credentials')) {
          console.error(err);
        }

        if (errorMessage.includes('401') || errorMessage.includes('Invalid Credentials')) {
          localStorage.removeItem('google_access_token');
          setError("Session expired. Please sign out and sign in again to view your calendar.");
        } else if (errorMessage.includes('Google Calendar API has not been used') || errorMessage.includes('is disabled')) {
          const match = errorMessage.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/calendar-json\.googleapis\.com\/overview\?project=\d+/);
          const url = match ? match[0] : 'https://console.developers.google.com/apis/library/calendar-json.googleapis.com';

          setError(
            `The Google Calendar API is not enabled for this project. Please enable it here: ${url}`
          );
        } else {
          setError(`Failed to fetch Google Calendar events: ${errorMessage}`);
        }
        setMonthEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthEvents();
  }, [currentMonth]);

  // Filter events for the selected date
  const selectedDayEvents = date ? monthEvents.filter(event => {
    const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date + 'T00:00:00') : new Date());
    return eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear();
  }).map(event => {
    const start = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date + 'T00:00:00') : new Date());
    const end = event.end.dateTime ? new Date(event.end.dateTime) : (event.end.date ? new Date(event.end.date + 'T23:59:59') : new Date());

    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    let durationStr = '';
    if (durationHours > 0) durationStr += `${durationHours}h `;
    if (remainingMinutes > 0 || durationHours === 0) durationStr += `${remainingMinutes}m`;

    return {
      id: event.id,
      title: event.summary,
      time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationStr.trim(),
    };
  }) : [];

  // Identify days with events for the calendar indicator
  const daysWithEvents = monthEvents.map(event => {
    return event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date + 'T00:00:00') : new Date());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Manage your meetings and events."
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex-none">
          <Card className="w-fit">
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                required
                className="rounded-md"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={{
                  hasEvent: daysWithEvents
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--primary)',
                    textDecorationThickness: '2px'
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 min-w-[300px]">
          <Card>
            <CardHeader>
              <CardTitle>Schedule for {date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today'}</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading events...' : `You have ${selectedDayEvents.length} events scheduled.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded break-words">
                  {error.includes('http') ? (
                    <span>
                      {error.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                        part.match(/^https?:\/\//) ? (
                          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-700">
                            Enable API
                          </a>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  ) : (
                    error
                  )}
                </div>
              )}

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
              {!isLoading && selectedDayEvents.length === 0 && !error && (
                <p className="text-muted-foreground">No events scheduled for this day.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
