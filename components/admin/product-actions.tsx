"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProduct, setProductActive } from "@/app/admin/actions";

export function ProductActions({
  productId,
  active,
  productName,
}: {
  productId: string;
  active: boolean;
  productName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    await setProductActive(productId, !active);
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${productName}" permanently?\n\nOrder history is preserved (item snapshots stay), but this cannot be undone.`,
    );
    if (!confirmed) return;
    setBusy(true);
    const result = await deleteProduct(productId);
    setBusy(false);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/products/${productId}`}
        className="rounded-sm border border-line-strong px-2.5 py-1.5 text-[12px] font-semibold hover:border-ink"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy}
        className="rounded-sm border border-line-strong px-2.5 py-1.5 text-[12px] font-semibold hover:border-ink disabled:opacity-50"
      >
        {active ? "Hide" : "Publish"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="rounded-sm border border-danger/40 px-2.5 py-1.5 text-[12px] font-semibold text-danger hover:bg-danger hover:text-white disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
