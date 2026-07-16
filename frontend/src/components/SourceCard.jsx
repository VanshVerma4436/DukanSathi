export default function SourceCard({ source, index }) {
  return (
    <div className="source-card" id={`source-${index}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-semibold text-brand-300 truncate max-w-[200px]" title={source.document}>
              {source.document}
            </span>
            <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/30">
              Page {source.page}
            </span>
            <span className="badge bg-surface-600 text-gray-400 border border-surface-500">
              Source {index + 1}
            </span>
          </div>
          <blockquote className="text-xs text-gray-400 leading-relaxed border-none pl-0 italic line-clamp-3">
            &ldquo;{source.content}&rdquo;
          </blockquote>
        </div>
      </div>
    </div>
  )
}
