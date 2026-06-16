export default function ComingSoonCard({ icon, title, note = "Coming soon" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">
          {note}
        </span>
      </div>
      <div className="text-center py-8 text-gray-300">
        <div className="text-3xl mb-1">{icon}</div>
      </div>
    </div>
  );
}