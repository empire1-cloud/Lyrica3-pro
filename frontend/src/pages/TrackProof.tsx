import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trackProof, getAuthToken } from "../lib/api";
import { Shield, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export function TrackProof() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  if (!getAuthToken()) {
    navigate("/auth", { replace: true });
    return null;
  }

  useEffect(() => {
    if (!id) return;
    trackProof(id)
      .then(setProof)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto p-6 text-zinc-500">Loading proof...</div>;
  if (!proof) return <div className="max-w-3xl mx-auto p-6 text-zinc-500">Proof not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => navigate("/music/tracks")} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Tracks
      </button>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-fuchsia-400" />
          <h1 className="text-xl font-semibold">{proof.title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ProofCard label="DNA Verification" status={proof.dna_verified}>
            {proof.dna_tag && <p className="text-xs text-zinc-500 font-mono mt-1">{proof.dna_tag.slice(0, 32)}</p>}
          </ProofCard>
          <ProofCard label="Blockchain Ledger" status={proof.ledger_valid}>
            {proof.ledger_tx && <p className="text-xs text-zinc-500 font-mono mt-1">{proof.ledger_tx.slice(0, 32)}</p>}
          </ProofCard>
          <ProofCard label="Soulprint" status={proof.soulprint_verified}>
            {proof.soulprint_confidence && <p className="text-xs text-zinc-500 mt-1">{(proof.soulprint_confidence * 100).toFixed(0)}% confidence</p>}
          </ProofCard>
          <ProofCard label="Royalty Trust" status={proof.royalty_trust}>
            {proof.royalty_risk?.verdict && <p className="text-xs text-zinc-500 mt-1">Verdict: {proof.royalty_risk.verdict}</p>}
          </ProofCard>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Lyrics</h2>
        <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-200">{proof.lyrics || "—"}</pre>
      </div>
    </div>
  );
}

function ProofCard({ label, status, children }: { label: string; status?: boolean; children?: React.ReactNode }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-zinc-400">{label}</p>
        {status ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
      </div>
      <p className={`text-sm font-medium ${status ? "text-emerald-300" : "text-red-300"}`}>
        {status ? "Verified" : "Unverified"}
      </p>
      {children}
    </div>
  );
}
