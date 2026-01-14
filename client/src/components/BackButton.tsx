import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  'data-testid'?: string;
}

export function BackButton({ 
  href = '/my-dashboard', 
  onClick,
  className = '',
  iconClassName = '',
  'data-testid': testId = 'button-back'
}: BackButtonProps) {
  const buttonContent = (
    <button 
      onClick={onClick}
      className={`
        min-w-[44px] min-h-[44px] 
        w-11 h-11
        flex items-center justify-center 
        rounded-xl 
        hover:bg-white/20 dark:hover:bg-white/10
        active:bg-white/30 dark:active:bg-white/20
        transition-colors
        touch-manipulation
        ${className}
      `}
      data-testid={testId}
      aria-label="Go back"
    >
      <ArrowLeft className={`w-5 h-5 ${iconClassName}`} />
    </button>
  );

  if (onClick && !href) {
    return buttonContent;
  }

  return (
    <Link href={href}>
      {buttonContent}
    </Link>
  );
}

export default BackButton;
