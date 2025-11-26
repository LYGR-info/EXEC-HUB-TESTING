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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CalculationType, RevenueStream } from '@/lib/data';

const calculationTypeIcons: Record<CalculationType, React.ElementType> = {
    'Sale-side': DollarSign,
    'Monthly Fee': Repeat,
    Equity: PieChart,
};

interface RevenueStreamCardProps {
    stream: RevenueStream;
    onUpdate: (updatedStream: RevenueStream) => void;
    onDelete: (streamId: string) => void;
}

export default function RevenueStreamCard({ stream, onUpdate, onDelete }: RevenueStreamCardProps) {
    const [calculationType, setCalculationType] = useState<CalculationType>(stream.type);
    const [confidenceRate, setConfidenceRate] = useState(stream.confidenceRate);
    const [isCommissionApplied, setIsCommissionApplied] = useState(stream.isCommissionApplied || false);
    const [commissionPercentage, setCommissionPercentage] = useState(stream.commission || 0);
    const [opportunityValue, setOpportunityValue] = useState(stream.opportunityValue || 0);
    const [monthlyFee, setMonthlyFee] = useState(stream.monthlyFee || 0);
    const [contractTerm, setContractTerm] = useState(stream.contractTerm || 0);
    const [equityPercentage, setEquityPercentage] = useState(stream.equityPercentage || 0);
    const [companyValuation, setCompanyValuation] = useState(stream.companyValuation || 0);

    // Update local state when prop changes
    useEffect(() => {
        setCalculationType(stream.type);
        setConfidenceRate(stream.confidenceRate);
        setIsCommissionApplied(stream.isCommissionApplied || false);
        setCommissionPercentage(stream.commission || 0);
        setOpportunityValue(stream.opportunityValue || 0);
        setMonthlyFee(stream.monthlyFee || 0);
        setContractTerm(stream.contractTerm || 0);
        setEquityPercentage(stream.equityPercentage || 0);
        setCompanyValuation(stream.companyValuation || 0);
    }, [stream]);

    // Notify parent of changes
    useEffect(() => {
        const updatedStream: RevenueStream = {
            ...stream,
            type: calculationType,
            confidenceRate,
            isCommissionApplied,
            commission: commissionPercentage,
            opportunityValue,
            monthlyFee,
            contractTerm,
            equityPercentage,
            companyValuation,
        };
        // Avoid infinite loop by checking if values actually changed? 
        // Actually, the parent will update the state, which will trigger the first useEffect.
        // To avoid loop, we should only call onUpdate when user interacts, not in useEffect.
        // But for simplicity in this structure, let's just expose the values or handle change in handlers.
    }, [calculationType, confidenceRate, isCommissionApplied, commissionPercentage, opportunityValue, monthlyFee, contractTerm, equityPercentage, companyValuation]);

    const handleChange = (updates: Partial<RevenueStream>) => {
        onUpdate({ ...stream, ...updates });
    };

    const baseValue = useMemo(() => {
        switch (calculationType) {
            case 'Sale-side':
                return opportunityValue;
            case 'Monthly Fee':
                return monthlyFee * contractTerm;
            case 'Equity':
                return companyValuation * (equityPercentage / 100);
            default:
                return 0;
        }
    }, [calculationType, opportunityValue, monthlyFee, contractTerm, equityPercentage, companyValuation]);

    const pipelineValue = useMemo(() => {
        let value = baseValue * (confidenceRate / 100);
        if (calculationType === 'Sale-side' && isCommissionApplied) {
            value = value * (commissionPercentage / 100);
        }
        return value;
    }, [baseValue, confidenceRate, isCommissionApplied, commissionPercentage, calculationType]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getCalculationString = () => {
        const confidenceStr = `${confidenceRate}% (Confidence)`;

        switch (calculationType) {
            case 'Sale-side':
                const commissionStr = isCommissionApplied ? `* ${commissionPercentage}% (Commission)` : '';
                return `${formatCurrency(opportunityValue)} (Tx. Amount) * ${confidenceStr} ${commissionStr}`;
            case 'Monthly Fee':
                return `${formatCurrency(monthlyFee)} (Fee) * ${contractTerm} (Term) * ${confidenceStr}`;
            case 'Equity':
                return `${formatCurrency(companyValuation)} (Valuation) * ${equityPercentage}% (Equity) * ${confidenceStr}`;
            default:
                return '';
        }
    }

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: number) => void, field: keyof RevenueStream) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        setter(finalValue);
        handleChange({ [field]: finalValue });
    };

    const formatInputValue = (value: number) => {
        if (isNaN(value) || value === 0) return '';
        return new Intl.NumberFormat('en-US').format(value);
    }

    const CalculationIcon = calculationTypeIcons[calculationType];

    return (
        <Card className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(stream.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalculationIcon className="h-4 w-4" />
                    {calculationType} Stream
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor={`calc-type-${stream.id}`}>Calculation Type</Label>
                    <Select
                        value={calculationType}
                        onValueChange={(value) => {
                            const type = value as CalculationType;
                            setCalculationType(type);
                            handleChange({ type });
                        }}
                    >
                        <SelectTrigger id={`calc-type-${stream.id}`}>
                            <SelectValue placeholder="Select calculation type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sale-side">Sale-side</SelectItem>
                            <SelectItem value="Monthly Fee">Monthly Fee</SelectItem>
                            <SelectItem value="Equity">Equity</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {calculationType === 'Sale-side' && (
                    <div className="relative">
                        <Label>Transaction amount</Label>
                        <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={formatInputValue(opportunityValue)}
                            onChange={(e) => handleCurrencyChange(e, setOpportunityValue, 'opportunityValue')}
                            className="pl-8"
                        />
                    </div>
                )}
                {calculationType === 'Monthly Fee' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Label>Monthly Fee</Label>
                            <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                            <Input type="text" value={formatInputValue(monthlyFee)} onChange={(e) => handleCurrencyChange(e, setMonthlyFee, 'monthlyFee')} className="pl-8" />
                        </div>
                        <div>
                            <Label>Contract Term (Months)</Label>
                            <Input
                                type="number"
                                value={contractTerm || ''}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setContractTerm(val);
                                    handleChange({ contractTerm: val });
                                }}
                            />
                        </div>
                    </div>
                )}
                {calculationType === 'Equity' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Label>Equity %</Label>
                            <Percent className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                value={equityPercentage || ''}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEquityPercentage(val);
                                    handleChange({ equityPercentage: val });
                                }}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <Label>Company Valuation</Label>
                            <DollarSign className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                            <Input type="text" value={formatInputValue(companyValuation)} onChange={(e) => handleCurrencyChange(e, setCompanyValuation, 'companyValuation')} className="pl-8" />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Label>Confidence Rate (%)</Label>
                        <Percent className="absolute left-2.5 top-8 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="Enter %"
                            className="pl-8"
                            value={confidenceRate || ''}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setConfidenceRate(val);
                                handleChange({ confidenceRate: val });
                            }}
                            min="0"
                            max="100"
                        />
                    </div>
                    {calculationType === 'Sale-side' && (
                        <div className="flex flex-col justify-end">
                            <div className="flex items-center space-x-2 mb-2 h-10">
                                <Checkbox
                                    id={`commission-checkbox-${stream.id}`}
                                    checked={isCommissionApplied}
                                    onCheckedChange={(checked) => {
                                        const val = checked as boolean;
                                        setIsCommissionApplied(val);
                                        handleChange({ isCommissionApplied: val });
                                    }}
                                />
                                <Label htmlFor={`commission-checkbox-${stream.id}`} className="text-sm font-medium leading-none">
                                    Commission?
                                </Label>
                            </div>
                            {isCommissionApplied && (
                                <div className="relative">
                                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="%"
                                        className="pl-8"
                                        value={commissionPercentage || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setCommissionPercentage(val);
                                            handleChange({ commission: val });
                                        }}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 border-t pt-4">
                    <div className="text-2xl font-bold">{formatCurrency(pipelineValue)}</div>
                    <p className="text-xs text-muted-foreground">
                        Pipeline Value: <span className="font-mono">{getCalculationString()}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
