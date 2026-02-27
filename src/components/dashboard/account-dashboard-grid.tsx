
'use client';
import { useMemo } from 'react';
import {
  accountDashboardCards,
  DashboardCard as Card,
} from '@/lib/account-dashboard-cards';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortableCard } from './sortable-card';


export default function AccountDashboardGrid({ accountId }: { accountId: string }) {
  const [storedCards, setStoredCards] = useLocalStorage<Card[]>(
    'account-dashboard-cards',
    accountDashboardCards
  );

  const visibleCards = useMemo(
    () => {
      const validIds = new Set(accountDashboardCards.map(c => c.id));
      return storedCards.filter(card => card.visible && validIds.has(card.id));
    },
    [storedCards]
  );

  const visibleCardIds = useMemo(() => visibleCards.map(c => c.id), [visibleCards]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setStoredCards((items) => {
        const activeIndex = items.findIndex((i) => i.id === active.id);
        const overIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, activeIndex, overIndex);
      });
    }
  }

  const cardComponents = useMemo(() => {
    const componentMap: { [key: string]: React.ComponentType<any> } = {};
    accountDashboardCards.forEach(card => {
      componentMap[card.id] = card.component;
    });
    return componentMap;
  }, []);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleCardIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:auto-rows-fr">
          {visibleCards.map(card => {
            const CardComponent = cardComponents[card.id];
            return (
              <SortableCard key={card.id} id={card.id} className={card.className}>
                {CardComponent ? <CardComponent accountId={accountId} /> : null}
              </SortableCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
