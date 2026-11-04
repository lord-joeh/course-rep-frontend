import { Button } from '@/components/ui/button';
import { ExternalLink, Terminal } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function BullBoardLinkButton() {
  const getBullBoardUrl = (): string => {
    const base = apiClient.defaults.baseURL || 'http://localhost:5000/api';
    // const origin = base.replace(/\/api\/?$/, '');
    return `${base}/admin/queues/ui`;
  };

  const handleOpenBullBoard = () => {
    const url = getBullBoardUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenBullBoard}
      className="h-9 gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
      aria-label="Open Bull-Board management console in new tab"
    >
      <Terminal className="w-4 h-4 text-primary" />
      <span>Bull-Board Console</span>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
    </Button>
  );
}

