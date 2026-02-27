'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    Handshake,
    Percent,
    PieChart,
    Repeat,
    Trash2,
    Calculator,
    TrendingUp,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Valuation, ValuationType } from '@/lib/data';

import Link from 'next/link';

interface ValuationCardProps {
    valuation: Valuation;
    onUpdate: (updatedValuation: Valuation) => void;
    onDelete: (valuationId: string) => void;
    accountId?: string;
}

export default function ValuationCard({ valuation, onUpdate, onDelete, accountId }: ValuationCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [localValuation, setLocalValuation] = useState(valuation);
    const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);

    useEffect(() => {
        if (!isDialogOpen) {
            setLocalValuation(valuation);
            // Sort history by date if it exists
            const sortedHistory = (valuation.history || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setChartData(sortedHistory);
        }
    }, [valuation, isDialogOpen]);

    // Update chart data when localValuation.history changes (e.g. adding points)
    useEffect(() => {
        if (isDialogOpen) {
            const sortedHistory = (localValuation.history || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setChartData(sortedHistory);
        }
    }, [localValuation.history, isDialogOpen]);


    const updateLocal = (updates: Partial<Valuation>) => {
        setLocalValuation(prev => ({ ...prev, ...updates }));
    };

    const handleSave = () => {
        onUpdate(localValuation);
        setIsDialogOpen(false);
    };

    const handleCancel = () => {
        setLocalValuation(valuation);
        setIsDialogOpen(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatInputValue = (value: number) => {
        if (isNaN(value) || value === 0) return '';
        return new Intl.NumberFormat('en-US').format(value);
    }

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        updateLocal({ amount: finalValue });
    };

    const handleAddHistoryPoint = () => {
        const today = new Date().toISOString().split('T')[0];
        const newPoint = { date: today, amount: localValuation.amount || 0 };
        const newHistory = [...(localValuation.history || []), newPoint];
        updateLocal({ history: newHistory });
    };

    const handleRemoveHistoryPoint = (index: number) => {
        const newHistory = [...(localValuation.history || [])];
        newHistory.splice(index, 1);
        updateLocal({ history: newHistory });
    };

    const handleHistoryChange = (index: number, field: 'date' | 'amount', value: string | number) => {
        const newHistory = [...(localValuation.history || [])];
        if (field === 'amount') {
            // ensure number
            newHistory[index] = { ...newHistory[index], [field]: Number(value) };
        } else {
            newHistory[index] = { ...newHistory[index], [field]: value as string };
        }
        updateLocal({ history: newHistory });
    };


    // Auto-set estimate type if 'Estimate' is unchecked or checked
    useEffect(() => {
        if (localValuation.isEstimate && !localValuation.estimateType) {
            updateLocal({ estimateType: 'Lower estimate' });
        } else if (!localValuation.isEstimate && localValuation.estimateType) {
            updateLocal({ estimateType: undefined });
        }
    }, [localValuation.isEstimate]);


    return (
        <>
            {/* Preview Card */}
            <Card
                className="relative hover:border-primary/50 transition-colors cursor-pointer group bg-card/40 border-dashed"
                onClick={() => setIsDialogOpen(true)}
            >
                <div className="absolute right-2 top-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {accountId && (
                        <Link href={`/deal-structure?accountId=${accountId}`} passHref>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                                title="Analyze in Deal Grapher"
                            >
                                <TrendingUp className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(valuation.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Company Valuation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="flex justify-between items-end">
                        <div className="text-2xl font-bold">{formatCurrency(valuation.amount)}</div>
                        <div className="h-[40px] w-[100px]">
                            {/* Tiny Graph */}
                            {(valuation.history && valuation.history.length > 1) && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                        {valuation.isEstimate && (
                            <Badge variant="secondary">{valuation.estimateType || 'Estimate'}</Badge>
                        )}
                        {!valuation.isEstimate && (
                            <Badge variant="secondary">Exact Valuation</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) handleCancel();
                else setIsDialogOpen(true);
            }}>
                <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Edit Valuation</DialogTitle>
                        <DialogDescription>
                            Set the valuation amount and track history.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Details</h3>
                            <div className="relative">
                                <Label htmlFor="amount">Current Amount</Label>
                                <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="text"
                                    value={formatInputValue(localValuation.amount || 0)}
                                    onChange={handleCurrencyChange}
                                    className="pl-8"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isEstimate"
                                    checked={localValuation.isEstimate}
                                    onCheckedChange={(checked) => updateLocal({ isEstimate: checked as boolean })}
                                />
                                <Label htmlFor="isEstimate">Estimate</Label>
                            </div>

                            {localValuation.isEstimate && (
                                <div>
                                    <Label htmlFor="estimateType">Estimate Type</Label>
                                    <Select
                                        value={localValuation.estimateType}
                                        onValueChange={(value) => updateLocal({ estimateType: value as ValuationType })}
                                    >
                                        <SelectTrigger id="estimateType">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Lower estimate">Lower estimate</SelectItem>
                                            <SelectItem value="High-end estimate">High-end estimate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-medium text-muted-foreground">History Graph</h3>
                                <Button variant="outline" size="sm" onClick={handleAddHistoryPoint} className="h-6 text-xs gap-1">
                                    <TrendingUp className="h-3 w-3" /> Add Point
                                </Button>
                            </div>

                            <div className="bg-muted/10 rounded-lg p-2 h-[150px] w-full border">
                                {(chartData.length > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <XAxis dataKey="date" hide />
                                            <YAxis hide domain={['auto', 'auto']} />
                                            <Tooltip
                                                formatter={(value: number) => [formatCurrency(value), 'Valuation']}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                        No history data
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {localValuation.history && localValuation.history.map((point, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground">Date</Label>
                                            <Input
                                                type="date"
                                                className="h-7 text-xs"
                                                value={point.date}
                                                onChange={(e) => handleHistoryChange(index, 'date', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground">Amount</Label>
                                            <Input
                                                type="number"
                                                className="h-7 text-xs"
                                                value={point.amount}
                                                onChange={(e) => handleHistoryChange(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 mb-0.5 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveHistoryPoint(index)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
