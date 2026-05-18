import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { AdminLoginForm } from "@/app/admin/admin-login-form";
import { getSiteContent } from "@/data/localized-site";
import { getAdminAuthStatus, hasAdminSession } from "@/lib/admin-auth";
import {
  getAdminProjectRows,
  readAdminConfig,
} from "@/lib/admin-config";
import { readCodexLoreIndex } from "@/lib/codex-lore-storage";
import { DEFAULT_SITE_LANGUAGE } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const authStatus = getAdminAuthStatus();
  const isLoggedIn = await hasAdminSession();

  if (!isLoggedIn) {
    return (
      <main className="adminShell">
        <AdminLoginForm authStatus={authStatus} />
      </main>
    );
  }

  const [config, loreIndex] = await Promise.all([
    readAdminConfig(),
    readCodexLoreIndex(),
  ]);
  const content = getSiteContent(DEFAULT_SITE_LANGUAGE);

  return (
    <main className="adminShell">
      <AdminDashboard
        initialConfig={config}
        initialIndex={{
          generatedAt: loreIndex.generatedAt,
          totals: loreIndex.totals,
        }}
        initialProjects={getAdminProjectRows(content, loreIndex, config)}
      />
    </main>
  );
}
