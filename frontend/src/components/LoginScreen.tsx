import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_LOGINS, login, ApiError } from "@/lib/api";

export function LoginScreen({ onAuthed }: { onAuthed: (token: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signIn(who: string, creds: { email: string; password: string }) {
    setBusy(who);
    setError(null);
    try {
      const { token } = await login(creds);
      onAuthed(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Underwriting Authority Console</h1>
        <p className="text-muted-foreground text-sm">
          A governed underwriting-ops backend. Authority limits and assignment rules are enforced in
          the API, not the UI. Sign in as a role to see the boundary.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign in as a seeded role</CardTitle>
          <CardDescription>
            One click, no signup. These are throwaway demo accounts on a disposable environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {DEMO_LOGINS.map((demo) => (
            <button
              key={demo.email}
              onClick={() => signIn(demo.email, demo)}
              disabled={busy !== null}
              className="border-border hover:bg-accent flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-medium">{demo.label}</span>
                <span className="text-muted-foreground block text-xs">{demo.note}</span>
              </span>
              {busy === demo.email ? (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              ) : (
                <ArrowRight className="text-muted-foreground size-4" />
              )}
            </button>
          ))}

          <div className="text-muted-foreground relative py-1 text-center text-xs">
            <span className="bg-card relative z-10 px-2">or with email</span>
            <span className="bg-border absolute top-1/2 left-0 h-px w-full" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void signIn("manual", { email, password });
            }}
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="underwriter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy !== null || !email || !password}>
              {busy === "manual" ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          {error && <p className="text-destructive text-center text-sm">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
