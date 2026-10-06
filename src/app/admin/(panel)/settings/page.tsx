import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { getStoreSettings } from "@/server/admin-data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader title="Shop settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
