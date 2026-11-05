import { useState } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const { isInstallable, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setIsDismissed(true);
    }
  };

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
          CR
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-foreground">Install CourseRep App</h4>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Dismiss installation prompt"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Add CourseRep to your home screen or desktop for fast offline timetable access and push alerts.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-7 text-xs font-semibold gap-1.5 px-3"
            >
              <Download className="h-3 w-3" />
              <span>Install App</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-7 text-xs px-2.5 text-muted-foreground"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

