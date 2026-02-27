
export async function fetchSpreadsheetData(accessToken: string, spreadsheetId: string, range: string) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        let errorMessage = `Failed to fetch spreadsheet data: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.text();
            errorMessage += ` - ${errorBody}`;
        } catch (e) {
            // Ignore
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.values || [];
}

export function extractSpreadsheetId(input: string): string {
    // Check if it's a URL
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
}
