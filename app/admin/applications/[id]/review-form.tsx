"use client";

import { reviewApplication } from "@/app/actions/applications";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ReviewForm({ application }: { application: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Determine suggested interest rate based on credit score
  const score = application.creditScore || 0;
  let suggestedRate = 14;
  if (score >= 750) suggestedRate = 9.5;
  else if (score >= 700) suggestedRate = 10.5;
  else if (score >= 650) suggestedRate = 12.0;

  async function handleReview(formData: FormData) {
    setLoading(true);
    try {
      const result = await reviewApplication(application.id, formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.fieldErrors) {
        toast.error("Please fill all required fields correctly.");
      } else {
        toast.success(`Application marked as ${formData.get("status")}`);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (application.status === "APPROVED" || application.status === "REJECTED") {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-2">Review Summary</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Final Decision</p>
            <p className="font-medium text-foreground">{application.status}</p>
          </div>
          {application.status === "APPROVED" && (
            <div>
              <p className="text-muted-foreground">Approved Interest Rate</p>
              <p className="font-medium text-foreground">{application.interestRate}% p.a.</p>
            </div>
          )}
          {application.reviewNote && (
            <div>
              <p className="text-muted-foreground">Reviewer Note</p>
              <p className="font-medium italic bg-muted p-2 rounded mt-1">{application.reviewNote}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 sticky top-6">
      <h3 className="font-semibold mb-4">Application Decision</h3>
      <form action={handleReview} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Decision</label>
          <select
            id="status"
            name="status"
            required
            defaultValue="UNDER_REVIEW"
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approve Application</option>
            <option value="REJECTED">Reject Application</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="interestRate" className="text-sm font-medium">
            Final Interest Rate (%)
          </label>
          <input
            type="number"
            id="interestRate"
            name="interestRate"
            step="0.1"
            min="1"
            max="36"
            defaultValue={application.interestRate || suggestedRate}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Suggested rate based on credit score.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="reviewNote" className="text-sm font-medium">Review Note (Internal)</label>
          <textarea
            id="reviewNote"
            name="reviewNote"
            rows={3}
            placeholder="Add notes about your decision..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-hover disabled:opacity-50 transition-colors btn-press flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Decision"}
        </button>
      </form>
    </div>
  );
}
