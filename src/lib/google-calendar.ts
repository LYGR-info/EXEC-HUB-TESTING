
export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    htmlLink: string;
}

export async function fetchGoogleCalendarEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
    });

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        let errorMessage = `Failed to fetch calendar events: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.text();
            errorMessage += ` - ${errorBody}`;
        } catch (e) {
            // Ignore error reading body
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.items || [];
}
