import React, { useState, useEffect } from 'react';
import { Flame, Zap, Crown, Music2, CheckCircle2, Loader2, CreditCard, Star } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://api.lyrica3.com';

interface Package {
  amount: number;
  currency: string;
  label: string;
  tier?: string;
  tagline: string;
  mode: string;
  credits?: number;
  product_name?: string;
}

interface BillingMe {
  tier: string;
  credits: number;
  billing: Record<string, unknown>;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  soulfire: <Flame className="w-6 h-6 text-amber-400" />,
  maestro:  <Crown className="w-6 h-6 text-rose-400" />,
  label:    <Star  className="w-6 h-6 text-purple-400" />,
};

const TIER_COLORS: Record<string, string> = {
  soulfire: 'from-amber-500/20 to-orange-600/10 border-amber-500/30',
  maestro:  'from-rose-500/20 to-pink-600/10 border-rose-500/30',
  label:    'from-purple-500/20 to-violet-600/10 border-purple-500/30',
};

export default function BillingPage() {
  const [packages, setPackages] = useState<Record<string, Package>>({});
  const [me, setMe] = useState<BillingMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('e1_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND}/api/billing/packages`).then(r => r.json()),
      token ? fetch(`${BACKEND}/api/billing/me`, { headers }).then(r => r.json()) : Promise.resolve(null),
    ]).then(([pkgs, meData]) => {
      setPackages(pkgs.packages || {});
      if (meData && !meData.detail) setMe(meData);
    }).catch(() => setError('Could not load billing info.')).finally(() => setLoading(false));
  }, []);

  const checkout = async (pkgId: string) => {
    if (!token) { setError('Sign in to subscribe.'); return; }
    setCheckingOut(pkgId);
    setError('');
    try {
      const r = await fetch(`${BACKEND}/api/billing/checkout`, {
        method: 'POST', headers,
        body: JSON.stringify({
          package_id: pkgId,
          success_url: window.location.origin + '/?billing=success',
          cancel_url: window.location.origin + '/?billing=cancel',
        }),
      });
      const d = await r.json();
      if (d.checkout_url) window.location.href = d.checkout_url;
      else setError(d.detail || 'Checkout failed.');
    } catch { setError('Checkout failed.'); }
    finally { setCheckingOut(null); }
  };

  const subs  = Object.entries(packages).filter(([, p]) => p.mode === 'subscription');
  const packs = Object.entries(packages).filter(([, p]) => p.mode === 'payment');

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

      {/* Current plan banner */}
      {me && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
          {TIER_ICONS[me.tier] ?? <Music2 className="w-6 h-6 text-neutral-400" />}
          <div>
            <p className="text-sm text-neutral-400">Current plan</p>
            <p className="font-bold text-neutral-100 capitalize">{me.tier === 'free' ? 'Free' : me.tier}</p>
          </div>
          {me.credits > 0 && (
            <div className="ml-auto text-right">
              <p className="text-sm text-neutral-400">AI credits</p>
              <p className="font-bold text-amber-400">{me.credits}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {/* Subscription tiers */}
      <section>
        <h2 className="text-xl font-bold text-neutral-100 mb-6 tracking-wide">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {subs.map(([id, pkg]) => {
            const active = me?.tier === pkg.tier;
            return (
              <div key={id} className={`relative rounded-2xl p-6 border bg-gradient-to-br ${TIER_COLORS[pkg.tier ?? ''] ?? 'from-neutral-800/40 to-neutral-900/40 border-neutral-700/40'} flex flex-col gap-4`}>
                {active && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ACTIVE
                  </span>
                )}
                <div className="flex items-center gap-3">
                  {TIER_ICONS[pkg.tier ?? ''] ?? <Music2 className="w-6 h-6 text-neutral-400" />}
                  <span className="font-bold text-lg text-neutral-100">{pkg.label}</span>
                </div>
                <p className="text-3xl font-black text-neutral-100">
                  ${pkg.amount.toFixed(0)}<span className="text-base font-normal text-neutral-400">/mo</span>
                </p>
                <p className="text-sm text-neutral-400 leading-relaxed">{pkg.tagline}</p>
                <button
                  onClick={() => checkout(id)}
                  disabled={!!checkingOut || active}
                  className={`mt-auto py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
                    }`}
                >
                  {checkingOut === id ? <Loader2 className="w-4 h-4 animate-spin" /> : active ? <><CheckCircle2 className="w-4 h-4" /> Current Plan</> : <><CreditCard className="w-4 h-4" /> Subscribe</>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Credit packs */}
      <section>
        <h2 className="text-xl font-bold text-neutral-100 mb-2 tracking-wide">AI Credit Packs</h2>
        <p className="text-sm text-neutral-500 mb-6">One-time purchase — use for stems, masters, mixes, video sync.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {packs.map(([id, pkg]) => (
            <div key={id} className="rounded-2xl p-5 border border-neutral-800/60 bg-neutral-900/50 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-neutral-200">{pkg.label}</span>
              </div>
              <p className="text-2xl font-black text-neutral-100">${pkg.amount.toFixed(0)}</p>
              <p className="text-xs text-neutral-500">{pkg.tagline}</p>
              <button
                onClick={() => checkout(id)}
                disabled={!!checkingOut}
                className="mt-auto py-2 rounded-xl font-bold text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all flex items-center justify-center gap-1.5"
              >
                {checkingOut === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CreditCard className="w-3 h-3" /> Buy</>}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
