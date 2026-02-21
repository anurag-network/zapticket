'use client';

import { useState } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zapticket/ui/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@zapticket/ui/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Loader2, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  onComplete: () => void;
  onClearSelection: () => void;
}

type BulkAction = 'update_status' | 'update_priority' | 'assign' | 'add_tag' | 'close';

export function BulkActions({ selectedIds, onComplete, onClearSelection }: BulkActionsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
  const [actionValue, setActionValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; processedCount: number; failedCount: number } | null>(null);

  const handleAction = async () => {
    if (!currentAction || selectedIds.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/bulk-operations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketIds: selectedIds,
          action: currentAction,
          value: actionValue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          success: data.success,
          processedCount: data.processedCount,
          failedCount: data.failedCount,
        });
        onComplete();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action: BulkAction) => {
    setCurrentAction(action);
    setActionValue('');
    setResult(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setCurrentAction(null);
    setActionValue('');
    setResult(null);
    onClearSelection();
  };

  const getActionTitle = () => {
    switch (currentAction) {
      case 'update_status':
        return 'Update Status';
      case 'update_priority':
        return 'Update Priority';
      case 'assign':
        return 'Assign Agent';
      case 'add_tag':
        return 'Add Tag';
      case 'close':
        return 'Close Tickets';
      default:
        return 'Bulk Action';
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
        <Badge variant="secondary">{selectedIds.length} selected</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openActionDialog('update_status')}>
              Update Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openActionDialog('update_priority')}>
              Update Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openActionDialog('assign')}>
              Assign Agent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openActionDialog('add_tag')}>
              Add Tag
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openActionDialog('close')} className="text-destructive">
              Close Tickets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Action Completed' : 'Action Partially Failed'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Processed: {result.processedCount} tickets
                {result.failedCount > 0 && ` • Failed: ${result.failedCount}`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This action will affect {selectedIds.length} tickets.
              </p>

              {currentAction === 'update_status' && (
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_ON_CUSTOMER">Waiting on Customer</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {currentAction === 'update_priority' && (
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {(currentAction === 'assign' || currentAction === 'add_tag') && (
                <p className="text-sm text-muted-foreground">
                  Select value from the dropdown above
                </p>
              )}

              {currentAction === 'close' && (
                <p className="text-sm text-muted-foreground">
                  This will close all selected tickets.
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={
                    loading ||
                    (currentAction !== 'close' && !actionValue)
                  }
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply to {selectedIds.length} Tickets
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
