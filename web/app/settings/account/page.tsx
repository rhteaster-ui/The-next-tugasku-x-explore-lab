import { DisplayNameForm } from "@/components/account/DisplayNameForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsAccountPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let displayName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
  }

  return (
    <div className="space-y-6 py-8">
      <header className="space-y-1">
        <span className="badge">Settings · Akun</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Setelan akun
        </h1>
        <p className="text-ink-300">
          Ubah nama tampilan dan preferensi dasar akun.
        </p>
      </header>

      <DisplayNameForm initial={displayName ?? ""} email={user?.email ?? ""} />
    </div>
  );
}
