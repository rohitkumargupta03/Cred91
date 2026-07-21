"use client";

import { payEMI } from "@/app/actions/loans";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PayEMIButtonProps {
  loanId: string;
  emiId: string;
  amount: number;
}

export function PayEMIButton({ loanId, emiId, amount }: PayEMIButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await payEMI(loanId, emiId, "ONLINE");
      if (result.success) {
        toast.success(`Payment of ${formatCurrency(amount)} processed successfully!`);
      } else {
        toast.error(result.error || "Payment failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors btn-press"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CreditCard className="h-3 w-3" />
      )}
      Pay
    </button>
  );
}
