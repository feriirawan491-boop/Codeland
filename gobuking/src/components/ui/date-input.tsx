import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
type DateInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  empty?: boolean;
};
export function DateInput({ className, empty, ...props }: DateInputProps) {
  return (
    <div className="date-control">
      <input
        {...props}
        type="date"
        data-empty={empty}
        className={cn('date-input', className)}
      />
      <CalendarDays size={18} strokeWidth={1.7} aria-hidden="true" />
    </div>
  );
}
