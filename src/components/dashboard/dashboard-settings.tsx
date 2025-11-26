'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { dashboardCards, DashboardCard as Card } from '@/lib/dashboard-cards';
import { Settings } from 'lucide-react';

export default function DashboardSettings() {
  const [cards, setCards] = useLocalStorage<Card[]>(
    'dashboard-cards',
    dashboardCards
  );

  const handleVisibilityChange = (cardId: string, checked: boolean) => {
    const newCards = cards.map(card =>
      card.id === cardId ? { ...card, visible: checked } : card
    );
    setCards(newCards);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Toggle the cards you want to see on your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {cards.map(card => (
            <div key={card.id} className="flex items-center justify-between">
              <Label htmlFor={`switch-${card.id}`} className="font-medium">
                {card.title}
              </Label>
              <Switch
                id={`switch-${card.id}`}
                checked={card.visible}
                onCheckedChange={checked =>
                  handleVisibilityChange(card.id, checked)
                }
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
