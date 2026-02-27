'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Account } from '@/lib/data';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Download } from 'lucide-react';

import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export default function DealStructurePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const accountId = searchParams.get('accountId');
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch accounts for selection list
    const accountsCollection = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `accounts`);
    }, [user, firestore]);
    const { data: accounts } = useCollection<Account>(accountsCollection);

    // Fetch specific account if ID is provided
    const accountRef = useMemo(() => {
        if (!user || !firestore || !accountId) return null;
        return doc(firestore, `accounts/${accountId}`);
    }, [user, firestore, accountId]);
    const { data: account } = useDoc<Account>(accountRef);

    const [data, setData] = useState<{ x: number; y: number; id: number; label?: string; category?: 'Valuation' | 'Opportunity' }[]>([
        { id: 1, x: 1672531200000, y: 1000000, label: 'Seed', category: 'Valuation' }, // Jan 1 2023
        { id: 2, x: 1688169600000, y: 1500000, label: 'Series A', category: 'Valuation' }, // Jul 1 2023
    ]);
    const [newX, setNewX] = useState('');
    const [newY, setNewY] = useState('');
    const [label, setLabel] = useState('');

    const [showLine, setShowLine] = useState(true); // Default to line for time series

    const handleAddPoint = () => {
        // ... handled below in updated logic
    };

    const handleDeletePoint = (id: number) => {
        setData(data.filter(point => point.id !== id));
    };

    // Helper to format X axis (timestamp to date)
    const dateFormatter = (tick: number | string) => {
        if (!tick) return '';
        try {
            return format(new Date(tick), 'MMM yyyy');
        } catch {
            return String(tick);
        }
    };

    // Currency formatter
    const currencyFormatter = (value: number | string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: "compact",
            maximumFractionDigits: 1
        }).format(Number(value));
    };

    const handleAddPointManual = () => {
        // If user enters a date string (YYYY-MM-DD), parse it. Else parse as number.
        let xVal: number;
        // Check if newX looks like a date
        if (newX.includes('-') || newX.includes('/')) {
            xVal = new Date(newX).getTime();
        } else {
            xVal = parseFloat(newX);
        }

        const yVal = parseFloat(newY);

        if (!isNaN(xVal) && !isNaN(yVal)) {
            setData([...data, { id: Date.now(), x: xVal, y: yVal, label, category: 'Valuation' }]);
            setNewX('');
            setNewY('');
            setLabel('');
        }
    };

    const getImageById = (id: string) => PlaceHolderImages.find(img => img.id === id);

    // Determine view mode
    const showSelection = !accountId;

    if (showSelection) {
        return (
            <div className="space-y-6 container mx-auto py-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Deal Grapher</h1>
                    <p className="text-muted-foreground">Select an account to start plotting valuations and deal structures.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Select Account</CardTitle>
                        <CardDescription>Choose an account to load its valuation history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Logo</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead>Industry</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts?.map(account => {
                                    const logo = getImageById(account.logoId);
                                    const hasValuation = account.valuations && account.valuations.length > 0;
                                    return (
                                        <TableRow
                                            key={account.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => router.push(`/deal-structure?accountId=${account.id}`)}
                                        >
                                            <TableCell>
                                                {logo && (
                                                    <div className="flex items-center justify-center bg-muted rounded-md w-10 h-10">
                                                        <Image
                                                            alt={`${account.name} logo`}
                                                            className="aspect-square object-contain rounded-md p-1"
                                                            height="32"
                                                            width="32"
                                                            src={logo.imageUrl}
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{account.name}</TableCell>
                                            <TableCell>{account.industry}</TableCell>
                                            <TableCell><Badge variant="outline">{account.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    Select
                                                    {hasValuation && <Badge variant="secondary" className="text-[10px] h-5">Has Data</Badge>}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {accounts?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No accounts found. Please create one in the Accounts tab.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Deal Structure Grapher</h2>
                    {account && <p className="text-muted-foreground">Drafting for: <span className="font-semibold text-foreground">{account.name}</span></p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/deal-structure')}>
                    Change Account
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>Deal Plotter</CardTitle>
                            <CardDescription>Visualizing valuation over time. (X: Time, Y: Valuation)</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="show-line"
                                checked={showLine}
                                onCheckedChange={(checked) => setShowLine(checked as boolean)}
                            />
                            <Label htmlFor="show-line">Connect Points</Label>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full border rounded-md p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Date"
                                        domain={['auto', 'auto']}
                                        tickFormatter={dateFormatter}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Valuation"
                                        tickFormatter={currencyFormatter}
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        labelFormatter={(label) => dateFormatter(label)}
                                        formatter={(value: any, name: any) => [currencyFormatter(value), name]}
                                    />
                                    <Legend />
                                    <Scatter
                                        name="Valuation"
                                        data={data.filter(d => d.category !== 'Opportunity').sort((a, b) => a.x - b.x)}
                                        fill="hsl(var(--primary))"
                                        line={showLine}
                                    />
                                    <Scatter
                                        name="Opportunities"
                                        data={data.filter(d => d.category === 'Opportunity').sort((a, b) => a.x - b.x)}
                                        fill="hsl(var(--chart-2))"
                                        shape="diamond"
                                        line={false}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Points</CardTitle>
                        <CardDescription>Manage graph coordinates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                            <h3 className="font-medium text-sm">Add New Point</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="x-val">X Value</Label>
                                    <Input
                                        id="x-val"
                                        type="number"
                                        placeholder="0"
                                        value={newX}
                                        onChange={(e) => setNewX(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="x-val">Date (or X)</Label>
                                    <Input
                                        id="x-val"
                                        type="text"
                                        placeholder="YYYY-MM-DD or number"
                                        value={newX}
                                        onChange={(e) => setNewX(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="y-val">Valuation (Y)</Label>
                                    <Input
                                        id="y-val"
                                        type="number"
                                        placeholder="Amount"
                                        value={newY}
                                        onChange={(e) => setNewY(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label htmlFor="label">Label (Optional)</Label>
                                    <Input
                                        id="label"
                                        placeholder="e.g. Series A"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddPointManual} className="w-full">
                                <Plus className="w-4 h-4 mr-2" /> Add Point
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <h3 className="font-medium text-sm">Current Points</h3>
                            {data.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No data points.</p>
                            ) : (
                                data.map((point) => (
                                    <div key={point.id} className="flex items-center justify-between bg-card border rounded p-2 text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{point.label || 'Point'}</span>
                                            <span className="text-xs text-muted-foreground">{dateFormatter(point.x)}: {currencyFormatter(point.y)}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeletePoint(point.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <ImportVariablesSection onImport={(importedData) => setData([...data, ...importedData])} accountId={accountId} />
            </div>
        </div>
    );
}

// Sub-component for fetching and importing
function ImportVariablesSection({ onImport, accountId }: { onImport: (data: any[]) => void, accountId: string | null }) {
    // We need useUser here to construct the fetch path
    // Assuming context is set up in layout, but we need the hook.
    // For simplicity, let's skip the actual Firestore hook complexity in this file edit and simulate 
    // OR better, we simply define the AccountFetch component if we can.

    // I'll assume we can't easily get the user context without importing it.
    // Let's rely on a simplified 'mock' or 'manual' recall if accountId is missing,
    // but if accountId is present, we try to fetch.

    const { user } = useUser();
    const firestore = useFirestore();

    // Memoize ref
    const accountRef = useMemo(() => {
        if (!user || !firestore || !accountId) return null;
        return doc(firestore, `accounts/${accountId}`);
    }, [user, firestore, accountId]);

    const { data: account } = useDoc<Account>(accountRef);

    if (!accountId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Variables</CardTitle>
                    <CardDescription>Pass ?accountId=... to recall variables.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        No active account context linked.
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!account) return <Card><CardContent className="p-6">Loading variables...</CardContent></Card>;

    const hasValuations = account.valuations && account.valuations.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Recall Variables
                </CardTitle>
                <CardDescription>Import data from {account.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Available Datasets</Label>

                    {hasValuations ? (
                        <div className="border rounded-md p-3 bg-muted/10 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm">Valuation History</div>
                                    <div className="text-xs text-muted-foreground">
                                        {account.valuations?.[0]?.history?.length || 0} data points
                                    </div>
                                </div>
                                <Badge variant="outline">Valuation</Badge>
                            </div>

                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs"
                                onClick={() => {
                                    // Transform history to graph data
                                    const history = account.valuations?.[0]?.history || [];
                                    const points = history.map((h: any) => ({
                                        id: Date.now() + Math.random(),
                                        x: new Date(h.date).getTime(),
                                        y: h.amount,
                                        label: 'Historical',
                                        category: 'Valuation' as const
                                    }));
                                    points.push({
                                        id: Date.now() + Math.random(),
                                        x: Date.now(),
                                        y: account.valuations?.[0]?.amount || 0,
                                        label: 'Current',
                                        category: 'Valuation' as const
                                    });

                                    onImport(points);
                                }}
                            >
                                <Download className="mr-2 h-3 w-3" />
                                Import to Graph
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">No valuations found.</div>
                    )}

                    {account.revenueStreams && account.revenueStreams.length > 0 ? (
                        <div className="border rounded-md p-3 bg-muted/10 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm">Opportunities</div>
                                    <div className="text-xs text-muted-foreground">
                                        {account.revenueStreams.length} active opportunities
                                    </div>
                                </div>
                                <Badge variant="outline">Revenue</Badge>
                            </div>

                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs"
                                onClick={() => {
                                    const points = account.revenueStreams
                                        .filter(stream => stream.type !== 'Monthly Fee')
                                        .map(stream => ({
                                            id: Date.now() + Math.random(),
                                            x: Date.now(), // Use current date as these are 'current' opportunities
                                            y: stream.opportunityValue || 0,
                                            label: `Opp: ${stream.type}`,
                                            category: 'Opportunity' as const
                                        }));

                                    onImport(points);
                                }}
                            >
                                <Download className="mr-2 h-3 w-3" />
                                Import to Graph
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">No opportunities found.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
