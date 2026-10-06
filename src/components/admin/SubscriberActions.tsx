"use client";

import { Check, Trash2 } from "lucide-react";
import { RowActions } from "@/components/admin/RowActions";
import { deleteNotify, markNotified } from "@/server/actions/inbox";

export function MarkGroupNotified({ ids }: { ids: number[] }) {
  return (
    <RowActions
      actions={[{ label: <><Check className="h-4 w-4" aria-hidden /> Mark all as notified</>, tone: "primary", run: () => markNotified(ids), confirm: "Mark everyone in this list as notified?" }]}
    />
  );
}

export function DeleteSubscriber({ id }: { id: number }) {
  return <RowActions actions={[{ label: <Trash2 className="h-4 w-4" aria-hidden />, ariaLabel: "Remove", tone: "danger", run: () => deleteNotify(id), confirm: "Remove this email from the list?" }]} />;
}
