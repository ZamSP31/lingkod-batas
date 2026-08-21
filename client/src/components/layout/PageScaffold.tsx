interface PageScaffoldProps {
  title: string;
  description: string;
}

/**
 * Temporary stand-in for attorney pages whose mockups haven't been
 * turned into components yet, so sidebar navigation always resolves to
 * something instead of a blank/broken route. Delete the usage once the
 * real page exists — this component itself can stay for future screens.
 */
function PageScaffold({ title, description }: PageScaffoldProps) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-950">
        {title}
      </h1>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-white px-6 py-20 text-center">
        <p className="text-sm font-medium text-ink-600">Coming soon</p>
        <p className="max-w-sm text-sm text-ink-400">{description}</p>
      </div>
    </div>
  );
}

export default PageScaffold;
