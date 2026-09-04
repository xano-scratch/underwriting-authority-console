import { useCallback, useEffect, useState } from "react";
import { FileText, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoginScreen } from "@/components/LoginScreen";
import { QueuePanel } from "@/components/QueuePanel";
import { DetailPanel } from "@/components/DetailPanel";
import { fetchMe, type Me } from "@/lib/api";
import { money, roleLabel } from "@/lib/format";

const TOKEN_KEY = "uac_token";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    let alive = true;
    fetchMe(token)
      .then((m) => alive && setMe(m))
      .catch(() => {
        if (!alive) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => alive && setAuthLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const onAuthed = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setAuthLoading(true);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMe(null);
    setSelectedId(null);
  }, []);

  if (authLoading) {
    return <div className="text-muted-foreground grid min-h-screen place-items-center text-sm">Loading…</div>;
  }

  if (!token || !me) {
    return <LoginScreen onAuthed={onAuthed} />;
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Underwriting Authority Console</p>
            <p className="text-muted-foreground text-xs leading-tight">Governed by the API, not the UI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{me.name}</p>
            <p className="text-muted-foreground text-xs leading-tight">
              Authority limit {money(me.authority_limit)}
            </p>
          </div>
          <Badge variant="outline">{roleLabel(String(me.role))}</Badge>
          <Button variant="ghost" size="icon-sm" onClick={logout} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(320px,380px)_1fr]">
        <section className="overflow-hidden border-r">
          <QueuePanel
            token={token}
            me={me}
            selectedId={selectedId}
            onSelect={setSelectedId}
            refreshKey={refreshKey}
          />
        </section>
        <section className="overflow-hidden">
          {selectedId ? (
            <DetailPanel
              token={token}
              me={me}
              submissionId={selectedId}
              onChanged={() => setRefreshKey((k) => k + 1)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm">
              <FileText className="size-6" />
              Select a submission to review its decision panel and audit trail.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
