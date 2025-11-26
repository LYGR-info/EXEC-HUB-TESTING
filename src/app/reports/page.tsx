import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function ReportsPage() {
  // You can get this URL by going to your Google Sheet, clicking "File" > "Share" > "Publish to web",
  // selecting "Embed", and copying the `src` attribute from the iframe code.
  const googleSheetEmbedUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-pBvb8Yt9-d_p2c0S-h-e2-9L-h9X0uL-pZ-9S-nZ-sH-rP-1gS-fE-aD-7hX-yV-zK/pubhtml?gid=0&single=true&widget=true&headers=false";

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Reports"
        description="Live data from integrated business intelligence sources."
      />
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>How to use this page</AlertTitle>
        <AlertDescription>
          To display your own data, open your Google Sheet, go to <strong>File &gt; Share &gt; Publish to web</strong>, choose <strong>Embed</strong>, and copy the URL from the `src` attribute of the iframe tag. Then, replace the `googleSheetEmbedUrl` variable in the file `src/app/reports/page.tsx`.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Sales Performance</CardTitle>
          <CardDescription>
            This report shows the latest sales data, updated in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-lg border">
            <iframe
              src={googleSheetEmbedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              className="rounded-lg"
              allowFullScreen
            >
              Loading sheet...
            </iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
