import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

const paddingClasses = {
  none: '',
  sm: 'px-3 py-4 sm:px-4 sm:py-6',
  md: 'px-3 py-4 sm:px-6 sm:py-8',
  lg: 'px-4 py-6 sm:px-8 sm:py-12'
};

/**
 * Responsywny kontener z predefiniowanymi rozmiarami i paddingami
 * Automatycznie dostosowuje się do różnych rozmiarów ekranów
 */
export function ResponsiveContainer({ 
  children, 
  className, 
  size = 'lg', 
  padding = 'md' 
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      'container mx-auto w-full',
      sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsywny grid dla kart/komponentów
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8'
};

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, sm: 1, md: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridCols = cn(
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  );

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}