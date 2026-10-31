import { useRef, useState, type FormEvent } from "react";

interface Props {
  onSave: (text: string) => Promise<void>;
}

export default function ManualTranscriptionForm({ onSave }: Props) {
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || !confirmed || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    try { await onSave(text); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Transcription could not be saved."); }
    finally { pending.current = false; setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="mt-5 space-y-3 text-left">
      <p className="text-sm text-ink-soft">Open the original document above and transcribe its complete text, preserving wording and clause boundaries. Saved clauses require manual decisions and rationales; no automated legal assessment is performed.</p>
      <label htmlFor="manual-transcription" className="block text-sm font-semibold">Contract transcription</label>
      <textarea id="manual-transcription" value={text} maxLength={250000} rows={12} disabled={saving}
        onChange={event => { setText(event.target.value); setConfirmed(false); }}
        className="w-full rounded-lg border border-line p-3 text-sm" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} disabled={saving} onChange={event => setConfirmed(event.target.checked)} />
        I checked this transcription against the original document.
      </label>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
      <button type="submit" disabled={saving || !confirmed || !text.trim()} className="rounded-lg bg-maroon px-4 py-2 text-sm text-white disabled:opacity-50">
        {saving ? "Saving transcription…" : "Save transcription for manual review"}
      </button>
    </form>
  );
}
