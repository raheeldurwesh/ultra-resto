// src/components/OrderCard.jsx
// FIXES:
//   1. Shows customerName when present
//   2. Shows instructions separately from note
//   3. Grand total = total + tax (correctly labelled)
//   4. Subtotal / tax / total breakdown in card footer

import { fmt, STATUS, timeAgo, fmtDateTime } from '../utils/helpers'

export default function OrderCard({ 
  order, onUpdateStatus, onEdit, 
  onInvoice, onDelete, deletingId,
  compact = false 
}) {
  const meta  = STATUS[order.status] || STATUS.pending
  const grand = (order.total || 0) + (order.tax || 0)

  return (
    <div className={`card h-full flex flex-col p-5 space-y-4 transition-all duration-300
                    ${order.status === 'pending'   ? 'border-pending/25'   : ''}
                    ${order.status === 'preparing' ? 'border-preparing/25' : ''}
                    ${order.status === 'done'      ? 'border-done/20 opacity-75' : ''}`}>

      {/* Top row — order ID, table, customer, time, status badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold text-bright text-lg leading-none">
            #{order.orderId}
          </p>
          <p className="text-mid text-xs mt-1 font-body">
            Table <span className="text-bright font-semibold">{order.table}</span>
            {' · '}{fmtDateTime(order.createdAt)}
            <span className="text-faint ml-1">({timeAgo(order.createdAt)})</span>
          </p>
          {/* Customer name */}
          {order.customerName && (
            <p className="text-amber text-xs mt-0.5 font-body font-medium">
              👤 {order.customerName}
            </p>
          )}
        </div>
        <span className={meta.cls}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse-dot`} />
          {meta.label}
        </span>
      </div>

      {/* Items list */}
      {!compact && (
        <div className="bg-raised rounded-xl overflow-hidden flex flex-col">
          <div className="max-h-[180px] overflow-y-auto p-3 space-y-1.5 no-scrollbar">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm font-body">
                <span className="text-mid flex-1 min-w-0 pr-2">
                  <span className="text-amber font-display font-bold mr-1.5">{item.qty}×</span>
                  <span className="text-bright truncate">{item.name}</span>
                </span>
                <span className="text-mid text-right tabular-nums">{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          {(order.items || []).length > 5 && (
            <div className="bg-gradient-to-t from-raised to-transparent h-4 w-full -mt-4 pointer-events-none" />
          )}
        </div>
      )}

      {/* Note / instructions */}
      {(order.note || order.instructions) && (
        <div className="flex gap-2 bg-amber-soft border border-amber/20 rounded-xl px-3 py-2.5">
          <span className="text-amber text-sm flex-shrink-0">📝</span>
          <p className="text-bright text-xs font-body leading-relaxed">
            {order.note || order.instructions}
          </p>
        </div>
      )}

      {/* Totals + action buttons */}
      <div className="mt-auto border-t border-border pt-3 space-y-2">
        {/* Subtotal / tax / grand total */}
        <div className="space-y-1 text-xs font-body text-mid">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-bright">{fmt(order.total || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="text-bright">{fmt(order.tax || 0)}</span>
          </div>
          <div className="flex justify-between font-semibold text-sm pt-1 border-t border-border">
            <span className="text-bright">Total</span>
            <span className="text-amber font-display">{fmt(grand)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-1 last:pt-0">
          {/* Row 1: Status Change (Primary) */}
          {(order.status === 'pending' || order.status === 'preparing') && (
            <div className="flex mb-2 last:mb-0">
              {order.status === 'pending' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'preparing')}
                  className="flex-1 btn bg-preparing/10 border border-preparing/30 text-preparing
                             hover:bg-preparing/20 transition-all text-xs"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'done')}
                  className="flex-1 btn bg-done/10 border border-done/30 text-done
                             hover:bg-done/20 transition-all text-xs"
                >
                  Mark Done ✓
                </button>
              )}
            </div>
          )}

          {/* Row 2: Utilities (Secondary) */}
          <div className="flex items-center gap-2">
            {order.status === 'done' && (
              <span className="flex-1 text-done text-xs font-body font-semibold px-3 py-2 bg-done/5 rounded-xl border border-done/10 text-center">
                ✓ Delivered
              </span>
            )}
            
            {onEdit && order.status !== 'done' && (
              <button
                onClick={() => onEdit(order)}
                className="flex-1 btn py-2 text-xs rounded-xl
                           bg-amber/10 border border-amber/30 text-amber
                           hover:bg-amber/20"
                title="Edit Order"
              >
                ✏️ Edit
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              {onInvoice && (
                <button
                  onClick={() => onInvoice(order)}
                  className="btn-icon w-9 h-9"
                  title="Download Invoice"
                >
                  ⬇️
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(order)}
                  disabled={deletingId === order.id}
                  className="btn-icon w-9 h-9 text-danger border-danger/20 hover:border-danger/40 hover:text-danger hover:bg-danger/10"
                  title="Delete Order"
                >
                  {deletingId === order.id ? '…' : '🗑️'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
