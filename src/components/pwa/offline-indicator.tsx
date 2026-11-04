import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/90 px-3.5 py-2 text-xs text-amber-200 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
    >
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
      <span>You are currently offline. Cached pages and timetables remain accessible.</span>
    </div>
  );
}
