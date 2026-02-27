'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Building,
    DollarSign,
    Handshake,
    Percent,
    PieChart,
    Repeat,
    Trash2,
    TrendingUp,
} from 'lucide-react';
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
import { CalculationType, RevenueStream, calculateRevenue, calculateWeightedValue } from '@/lib/data';

const calculationTypeIcons: Record<CalculationType, React.ElementType> = {
    'Sale-side': DollarSign,
    'Buy-side': Handshake,
    'Monthly Fee': Repeat,
    'Raise': TrendingUp,
};

interface RevenueStreamCardProps {
    stream: RevenueStream;
    onUpdate: (updatedStream: RevenueStream) => void;
    onDelete: (streamId: string) => void;
}

export default function RevenueStreamCard({ stream, onUpdate, onDelete }: RevenueStreamCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Local state for the form (buffered changes)
    const [localStream, setLocalStream] = useState(stream);

    // Sync local state when prop changes, but only if dialog is closed to avoid overwriting user input
    useEffect(() => {
        if (!isDialogOpen) {
            setLocalStream(stream);
        }
    }, [stream, isDialogOpen]);

    // Helpers to update local state
    const updateLocal = (updates: Partial<RevenueStream>) => {
        setLocalStream(prev => ({ ...prev, ...updates }));
    };

    const handleSave = () => {
        onUpdate(localStream);
        setIsDialogOpen(false);
    };

    const handleCancel = () => {
        setLocalStream(stream); // Reset to prop value
        setIsDialogOpen(false);
    };

    // Derived values for local state (for the form)
    const pipelineValue = useMemo(() => {
        return calculateWeightedValue(localStream);
    }, [localStream]);

    // Derived values for the PREVIEW card (from props 'stream')
    const previewPipelineValue = useMemo(() => {
        return calculateWeightedValue(stream);
    }, [stream]);

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

    const CalculationIcon = calculationTypeIcons[stream.type];

    // Form handlers
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof RevenueStream) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        updateLocal({ [field]: finalValue });
    };

    return (
        <>
            {/* Preview Card */}
            <Card
                className="relative hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setIsDialogOpen(true)}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(stream.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CalculationIcon className="h-4 w-4" />
                        {stream.name || `${stream.type} Opportunity`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(previewPipelineValue)}</div>
                    <p className="text-xs text-muted-foreground">
                        {stream.type === 'Monthly Fee' ? 'Total MRR Value' : 'Weighted Pipeline Value'}
                    </p>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{stream.confidenceRate}% Confidence</Badge>
                        {stream.type !== 'Monthly Fee' && (
                            <Badge variant="outline">{formatCurrency(stream.opportunityValue || 0)} Deal Size</Badge>
                        )}
                        {stream.type === 'Monthly Fee' && (
                            <Badge variant="outline">{formatCurrency(stream.monthlyFee || 0)} / mo</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) handleCancel();
                else setIsDialogOpen(true);
            }}>
                <DialogContent className="max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Edit Opportunity</DialogTitle>
                        <DialogDescription>
                            Make changes to the opportunity details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor={`name-${stream.id}`}>Opportunity Name</Label>
                            <Input
                                id={`name-${stream.id}`}
                                placeholder="e.g. Series A Funding"
                                value={localStream.name || ''}
                                onChange={(e) => updateLocal({ name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor={`calc-type-${stream.id}`}>Calculation Type</Label>
                            <Select
                                value={localStream.type}
                                onValueChange={(value) => updateLocal({ type: value as CalculationType })}
                            >
                                <SelectTrigger id={`calc-type-${stream.id}`}>
                                    <SelectValue placeholder="Select calculation type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sale-side">Sale-side</SelectItem>
                                    <SelectItem value="Buy-side">Buy-side</SelectItem>
                                    <SelectItem value="Raise">Raise</SelectItem>
                                    <SelectItem value="Monthly Fee">Monthly Fee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(localStream.type === 'Sale-side' || localStream.type === 'Buy-side' || localStream.type === 'Raise') && (
                            <div className="relative">
                                <Label>Transaction amount</Label>
                                <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={formatInputValue(localStream.opportunityValue || 0)}
                                    onChange={(e) => handleCurrencyChange(e, 'opportunityValue')}
                                    className="pl-8"
                                />
                            </div>
                        )}
                        {localStream.type === 'Monthly Fee' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Label>Monthly Fee</Label>
                                    <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        value={formatInputValue(localStream.monthlyFee || 0)}
                                        onChange={(e) => handleCurrencyChange(e, 'monthlyFee')}
                                        className="pl-8"
                                    />
                                </div>
                                <div>
                                    <Label>Contract Term (Months)</Label>
                                    <Input
                                        type="number"
                                        value={localStream.contractTerm || ''}
                                        onChange={(e) => updateLocal({ contractTerm: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {/* Labels Row */}
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <Label className="flex flex-wrap items-baseline gap-x-2">
                                    <span>Confidence Rate (%)</span>
                                    <span className="text-muted-foreground font-normal text-xs whitespace-nowrap">Suggested confidence: 75%</span>
                                </Label>
                                {(localStream.type === 'Sale-side' || localStream.type === 'Buy-side' || localStream.type === 'Raise') && (
                                    <div className="flex items-center space-x-2 h-5 pb-0.5">
                                        <Checkbox
                                            id={`commission-checkbox-${stream.id}`}
                                            checked={localStream.isCommissionApplied}
                                            onCheckedChange={(checked) => updateLocal({ isCommissionApplied: checked as boolean })}
                                        />
                                        <Label htmlFor={`commission-checkbox-${stream.id}`} className="text-sm font-medium leading-none">
                                            Commission?
                                        </Label>
                                    </div>
                                )}
                            </div>

                            {/* Inputs Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            placeholder="Enter %"
                                            className="pl-8"
                                            value={localStream.confidenceRate || ''}
                                            onChange={(e) => updateLocal({ confidenceRate: Number(e.target.value) })}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    {localStream.commissionTiers && localStream.commissionTiers.length > 0 && (
                                        <div className="p-3 border rounded-md bg-amber-100 text-amber-900 shadow-sm text-xs mt-2 block">
                                            <p className="font-semibold mb-1">Commission calculation note:</p>
                                            <p>Tiered commissions are calculated as: % of First Tier Amount + % of Second Tier Amount + % of Third tier amount, etc.</p>
                                            <p className="mt-2 italic opacity-90">If it should instead be calculated as % of total amount at the final tier, please let me know so I can set it as such.</p>
                                        </div>
                                    )}
                                </div>
                                {(localStream.type === 'Sale-side' || localStream.type === 'Buy-side' || localStream.type === 'Raise') && (
                                    localStream.isCommissionApplied ? (
                                        <div className="space-y-3">
                                            {localStream.type === 'Raise' && (
                                                <div className="flex items-center space-x-2 pb-1">
                                                    <Label className="text-xs text-muted-foreground">Mode:</Label>
                                                    <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
                                                        <Button
                                                            variant={(!localStream.commissionTiers || localStream.commissionTiers.length === 0) ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => updateLocal({ commissionTiers: undefined })}
                                                        >
                                                            Flat
                                                        </Button>
                                                        <Button
                                                            variant={(localStream.commissionTiers && localStream.commissionTiers.length > 0) ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => updateLocal({ commissionTiers: [{ rate: 5, cap: 1000000 }, { rate: 4 }] })}
                                                        >
                                                            Tiered
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {!localStream.commissionTiers || localStream.commissionTiers.length === 0 ? (
                                                <div className="relative">
                                                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        placeholder="%"
                                                        className="pl-8"
                                                        value={localStream.commission || ''}
                                                        onChange={(e) => updateLocal({ commission: Number(e.target.value) })}
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-2 border rounded-md p-2 bg-muted/10">
                                                    {localStream.commissionTiers.map((tier, index) => (
                                                        <div key={index} className="flex gap-2 items-center text-sm">
                                                            <div className="flex-1">
                                                                <span className="text-muted-foreground text-xs block mb-0.5">
                                                                    {index === localStream.commissionTiers!.length - 1 ? 'Remaining' : 'Up to'}
                                                                </span>
                                                                {index === localStream.commissionTiers!.length - 1 ? (
                                                                    <div className="h-9 flex items-center px-3 border rounded-md bg-muted/20 text-muted-foreground font-medium text-xs">
                                                                        Any amount
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 pl-6 text-xs"
                                                                            value={tier.cap || ''}
                                                                            onChange={(e) => {
                                                                                const newTiers = [...localStream.commissionTiers!];
                                                                                newTiers[index] = { ...tier, cap: Number(e.target.value) };
                                                                                updateLocal({ commissionTiers: newTiers });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="w-20">
                                                                <span className="text-muted-foreground text-xs block mb-0.5">Rate (%)</span>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs"
                                                                    value={tier.rate}
                                                                    onChange={(e) => {
                                                                        const newTiers = [...localStream.commissionTiers!];
                                                                        newTiers[index] = { ...tier, rate: Number(e.target.value) };
                                                                        updateLocal({ commissionTiers: newTiers });
                                                                    }}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 mt-4 text-muted-foreground hover:text-destructive"
                                                                onClick={() => {
                                                                    const newTiers = localStream.commissionTiers!.filter((_, i) => i !== index);
                                                                    if (newTiers.length === 0) {
                                                                        updateLocal({ commissionTiers: undefined });
                                                                    } else {
                                                                        // Ensure the last one always has undefined cap
                                                                        delete newTiers[newTiers.length - 1].cap;
                                                                        updateLocal({ commissionTiers: newTiers });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs h-7"
                                                        onClick={() => {
                                                            const newTiers = [...localStream.commissionTiers!];
                                                            // Provide a default cap for the *previous* last item, which is now second to last
                                                            if (newTiers.length > 0) {
                                                                newTiers[newTiers.length - 1].cap = 1000000;
                                                            }
                                                            // Add new "Remaining" tier
                                                            newTiers.push({ rate: 3 });
                                                            updateLocal({ commissionTiers: newTiers });
                                                        }}
                                                    >
                                                        + Add Tier
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div></div>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="mt-4 border-t pt-4 bg-muted/10 p-4 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Estimated Value:</span>
                                <span className="text-xl font-bold">{formatCurrency(pipelineValue)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
