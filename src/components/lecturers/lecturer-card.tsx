import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lecturer } from '@/types';
import { toast } from 'sonner';
import { Mail, Phone, Copy, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface LecturerCardProps {
  lecturer: Lecturer;
  isRep?: boolean;
  onEdit?: (lecturer: Lecturer) => void;
  onDelete?: (lecturer: Lecturer) => void;
}

function getInitials(name?: string): string {
  if (!name) return 'LC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LecturerCard({
  lecturer,
  isRep = false,
  onEdit,
  onDelete,
}: LecturerCardProps) {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  const copyToClipboard = async (text: string, type: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(type);
      toast.success(`${type === 'email' ? 'Email' : 'Phone number'} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const initials = getInitials(lecturer.name);

  return (
    <Card className="flex flex-col justify-between border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-wide">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate" title={lecturer.name}>
                {lecturer.name}
              </h3>
              <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground mt-0.5">
                Faculty Member
              </Badge>
            </div>
          </div>

          {/* Rep Administrative Actions Dropdown */}
          {isRep && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(lecturer)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(lecturer)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Faculty
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Contact Info List */}
        <div className="space-y-2 pt-1 border-t border-border/60 text-sm">
          {/* Email Row */}
          <div className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`mailto:${lecturer.email}`}
                className="truncate text-foreground hover:text-primary hover:underline font-medium"
                title={`Send email to ${lecturer.email}`}
              >
                {lecturer.email}
              </a>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => copyToClipboard(lecturer.email, 'email')}
              title="Copy email address"
            >
              {copiedField === 'email' ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Phone Row */}
          <div className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              {lecturer.phone ? (
                <a
                  href={`tel:${lecturer.phone}`}
                  className="truncate text-foreground hover:text-primary hover:underline"
                  title={`Call ${lecturer.phone}`}
                >
                  {lecturer.phone}
                </a>
              ) : (
                <span className="text-muted-foreground italic text-xs">No phone on record</span>
              )}
            </div>
            {lecturer.phone && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(lecturer.phone!, 'phone')}
                title="Copy phone number"
              >
                {copiedField === 'phone' ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
