"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { Notice } from "@/components/ui/notice";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "danger";
    text: string;
  } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const result = await updateOrderStatus(orderId, status);
    setSaving(false);

    if (result.ok) {
      setMessage({ tone: "success", text: "Order status updated." });
      router.refresh();
    } else {
      setMessage({ tone: "danger", text: result.message });
    }
  }

  return (
    <div>
      <label htmlFor="order-status" className="label">
        Status
      </label>
      <select
        id="order-status"
        className="input"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={saving}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-primary mt-3 w-full"
        onClick={save}
        disabled={saving || status === currentStatus}
      >
        {saving ? "Saving…" : "Save status"}
      </button>
      {message ? (
        <div className="mt-3">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}
    </div>
  );
}
