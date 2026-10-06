"use client";

import { Mail, MailOpen, Trash2 } from "lucide-react";
import { RowActions } from "@/components/admin/RowActions";
import { deleteMessage, setMessageRead } from "@/server/actions/inbox";

export function MessageActions({ id, read }: { id: number; read: boolean }) {
  return (
    <RowActions
      actions={[
        { label: read ? <><Mail className="h-4 w-4" aria-hidden /> Mark unread</> : <><MailOpen className="h-4 w-4" aria-hidden /> Mark read</>, run: () => setMessageRead(id, !read) },
        { label: <><Trash2 className="h-4 w-4" aria-hidden /> Delete</>, tone: "danger", confirm: "Delete this message?", run: () => deleteMessage(id) },
      ]}
    />
  );
}
