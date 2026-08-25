export default function InstructionsBubble({ level, onClose }) {
  return (
    <div className="dialog-bubble-wrap instructions-wrap">
      <div className="dialog-bubble">
        <div className="name-badge">Mapache Mapachoso</div>
        <p className="text-xs font-black mb-1 text-amber-700 uppercase tracking-wide">¿Cómo se juega?</p>
        <div className="dialog-bubble-scroll">
          <p className="text-sm italic mb-1 text-amber-900 leading-relaxed font-bold">&ldquo;{level.instructions}&rdquo;</p>
        </div>
        <button className="btn-action w-auto px-10 py-3" onClick={onClose}>¡Entendido!</button>
      </div>
    </div>
  )
}
