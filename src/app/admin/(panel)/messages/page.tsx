import type { Metadata } from "next";
import { Reply } from "lucide-react";
import { MessageActions } from "@/components/admin/MessageActions";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { cn, formatDateTime } from "@/lib/format";
import { listMessages } from "@/server/admin-data";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await listMessages();
  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the website’s contact form." />
      {messages.length ? (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={cn("rounded-3xl border bg-white p-5 shadow-sm", m.read ? "border-line" : "border-pink")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{m.name}</span>
                <span className="text-sm text-ink-soft">{m.email}</span>
                <span className="text-sm text-ink-soft">· {formatDateTime(m.createdAt)}</span>
                {!m.read && <Pill tone="pink">New</Pill>}
              </div>
              <p className="mt-2 whitespace-pre-line">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Hi Five by Jia")}`} className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-3 py-1.5 text-sm font-bold text-pink-deep">
                  <Reply className="h-4 w-4" aria-hidden /> Reply by email
                </a>
                <MessageActions id={m.id} read={m.read} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>No messages yet.</EmptyNote>
      )}
    </>
  );
}
