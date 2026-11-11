import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  disabled?: boolean;
  className?: string;
  text?: string;
}

export function GoogleSignInButton({
  onSuccess,
  disabled = false,
  className = '',
  text = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  const clientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '1039659774720-2fi6kd0j78lk7b5ekkunge7kd54ftts8.apps.googleusercontent.com';

  useEffect(() => {
    let checkInterval: any = null;

    const setupGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                onSuccess(response.credential);
              }
            },
          });

          if (containerRef.current) {
            (window as any).google.accounts.id.renderButton(containerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: containerRef.current.offsetWidth || 300,
              text: 'continue_with',
            });
            setIsGoogleLoaded(true);
          }
        } catch (err) {
          console.warn('Google Identity Services setup warning:', err);
        }
        return true;
      }
      return false;
    };

    if (!setupGoogle()) {
      checkInterval = setInterval(() => {
        if (setupGoogle()) {
          clearInterval(checkInterval);
        }
      }, 250);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [clientId, onSuccess]);

  const handleClick = () => {
    // Return mock token strictly in test environments
    if ((import.meta as any).env?.MODE === 'test') {
      onSuccess('mock-google-token-' + Date.now());
      return;
    }

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.()) {
            toast.error(
              'Google Sign-In prompt was suppressed by your browser. Please allow popups or try again.',
            );
          }
        });
        return;
      } catch (err) {
        console.warn('Google prompt error:', err);
      }
    }

    toast.error(
      'Google Sign-In is initializing or unavailable. Please check your network connection or sign in with your email.',
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-md">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className={`w-full font-medium flex items-center justify-center gap-2 border-border hover:bg-muted/50 cursor-pointer ${className}`}
        aria-label="Sign in with Google"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{text}</span>
      </Button>

      {/* Invisible overlay of the official Google button iframe */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full opacity-[0.001] cursor-pointer overflow-hidden z-10 [&>iframe]:w-full [&>iframe]:h-full"
        style={{ display: isGoogleLoaded && !disabled ? 'block' : 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
