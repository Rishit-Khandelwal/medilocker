export default function ComingSoonCard({ icon: Icon, title, note = "Coming soon" }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground text-sm">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 bg-bg border border-border text-muted rounded-full whitespace-nowrap">
          {note}
        </span>
      </div>
      <div className="flex items-center justify-center py-7 text-muted/40">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}