import { cn } from '@/lib/utils';

export default function Container({ className, ...props }) {
  return <div className={cn('w-full px-2 pt-2 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6', className)} {...props} />;
}
