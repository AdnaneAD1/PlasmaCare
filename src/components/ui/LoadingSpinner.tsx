import { twMerge } from 'tailwind-merge';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className }: LoadingSpinnerProps = {}) => {
  return (
    <div className="flex items-center justify-center">
      <div className={twMerge("animate-spin rounded-full h-8 w-8 border-b-2 border-primary", className)}></div>
      <span className="sr-only">Chargement...</span>
    </div>
  );
}

export { LoadingSpinner };
