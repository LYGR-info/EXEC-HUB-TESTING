import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { calendarEvents } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock } from 'lucide-react';

export default function CalendarCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Upcoming Schedule
        </CardTitle>
        <CardDescription>
          You have {calendarEvents.length} events scheduled for today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {calendarEvents.map((event, index) => (
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
              {index < calendarEvents.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
