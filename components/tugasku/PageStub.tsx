interface Props {
  eyebrow: string;
  title: string;
  body: string;
}

export function PageStub({ eyebrow, title, body }: Props) {
  return (
    <div className="space-y-6 py-8">
      <header className="space-y-1">
        <span className="badge">{eyebrow}</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="max-w-prose text-ink-300">{body}</p>
      </header>
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
          Status
        </h2>
        <p className="text-sm text-ink-300">
          Halaman ini adalah scaffold dari fase auth + cloud-foundation. UI
          interaktifnya akan diisi pada fase berikutnya — model data, RLS,
          dan endpoint sudah siap di belakang.
        </p>
      </div>
    </div>
  );
}
