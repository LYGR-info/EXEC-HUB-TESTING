'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type Account } from '@/lib/data';

const BreadcrumbSegment = ({
  segment,
  href,
  isLast,
  previousSegment
}: {
  segment: string;
  href: string;
  isLast: boolean;
  previousSegment?: string;
}) => {
  const { user } = useUser();
  const firestore = useFirestore();

  const isAccountId = previousSegment === 'accounts';

  const accountRef = useMemo(() => {
    if (!isAccountId || !user || !firestore) return null;
    return doc(firestore, `accounts/${segment}`);
  }, [isAccountId, user, firestore, segment]);

  const { data: account, isLoading } = useDoc<Account>(accountRef);

  let label = segment.charAt(0).toUpperCase() + segment.slice(1);

  if (isAccountId) {
    if (isLoading) label = '...';
    else if (account?.name) label = account.name;
  }

  return (
    <BreadcrumbItem>
      {isLast ? (
        <BreadcrumbPage>{label}</BreadcrumbPage>
      ) : (
        <BreadcrumbLink asChild>
          <Link href={href}>{label}</Link>
        </BreadcrumbLink>
      )}
    </BreadcrumbItem>
  );
};

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.length > 0 && <BreadcrumbSeparator />}
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;
          const previousSegment = index > 0 ? pathSegments[index - 1] : undefined;

          return (
            <React.Fragment key={href}>
              <BreadcrumbSegment
                segment={segment}
                href={href}
                isLast={isLast}
                previousSegment={previousSegment}
              />
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
};

export default Breadcrumbs;
