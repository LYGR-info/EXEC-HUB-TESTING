'use client';
import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCard } from './sortable-card';
import {
  dashboardCards,
  DashboardCard as Card,
} from '@/lib/dashboard-cards';

export default function DashboardGrid() {
  const [storedCards, setStoredCards] = useLocalStorage<Card[]>(
    'dashboard-cards',
    dashboardCards
  );

  const visibleCards = useMemo(
    () => storedCards.filter(card => card.visible),
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
    const componentMap: { [key: string]: React.ComponentType } = {};
    dashboardCards.forEach(card => {
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:auto-rows-fr">
          {visibleCards.map(card => {
            const CardComponent = cardComponents[card.id];
            return (
              <SortableCard key={card.id} id={card.id} className={card.className}>
                {CardComponent ? <CardComponent /> : null}
              </SortableCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
