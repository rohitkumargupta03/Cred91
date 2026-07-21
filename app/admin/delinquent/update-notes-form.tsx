"use client";

import { updateDelinquencyNotes } from "@/app/actions/loans";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface UpdateNotesFormProps {
  loanId: string;
  initialNotes: string;
}

export function UpdateNotesForm({ loanId, initialNotes }: UpdateNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateDelinquencyNotes(loanId, notes);
      if (result.success) {
        toast.success("Collection notes updated successfully");
      } else {
        toast.error(result.error || "Failed to update notes");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add details about calls, emails, or promises to pay..."
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || notes === initialNotes}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors btn-press"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save Notes
        </button>
      </div>
    </div>
  );
}
