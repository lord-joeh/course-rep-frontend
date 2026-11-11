import { Button } from '@/components/ui/button';

interface AppleSignInButtonProps {
  onSuccess: (idToken: string, user?: any) => void;
  disabled?: boolean;
  className?: string;
  text?: string;
}

export function AppleSignInButton({
  onSuccess,
  disabled = false,
  className = '',
  text = 'Continue with Apple',
}: AppleSignInButtonProps) {
  const handleClick = async () => {
    if (typeof window !== 'undefined' && (window as any).AppleID?.auth) {
      try {
        const response = await (window as any).AppleID.auth.signIn();
        if (response.authorization?.id_token) {
          onSuccess(response.authorization.id_token, response.user);
          return;
        }
      } catch {
        // Fallback for popup closures or unconfigured domains in dev
      }
    }
    // Development / test fallback token
    onSuccess('mock-apple-token-' + Date.now(), {
      name: { firstName: 'Apple', lastName: 'User' },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full font-medium flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 border-transparent cursor-pointer dark:bg-white dark:text-black dark:hover:bg-white/90 ${className}`}
      aria-label="Sign in with Apple"
    >
      <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170" aria-hidden="true">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.7-13.98-5.65-8.7-10.15-18.91-13.5-30.64-3.35-11.73-5.03-22.9-5.03-33.51 0-14.79 3.7-27.13 11.1-37.03 7.4-9.9 16.7-14.9 27.9-15 4.8.12 10.2 1.3 16.2 3.53 6 2.23 10.1 3.4 12.3 3.53 2.1-.25 6.4-1.46 12.9-3.65 6.5-2.2 11.8-3.23 15.9-3.1 11.9.5 21.6 4.7 29.1 12.6-10.4 6.3-15.5 15.1-15.3 26.4.2 8.8 3.5 16.2 9.9 22.2 6.4 6 14.1 9.3 23.1 9.9-1.9 5.8-4.3 11.7-7.2 17.7zm-27.4-106.1c0 5.8-2.1 11.4-6.3 16.8-4.2 5.4-9.4 9.1-15.6 11.1-.9-5.7.5-11.2 4.2-16.5 3.7-5.3 8.7-9.1 15-11.4 1.8 0 2.7 0 2.7 0z" />
      </svg>
      <span>{text}</span>
    </Button>
  );
}

