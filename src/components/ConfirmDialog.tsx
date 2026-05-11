import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-header">
          <div>
            <h2 id="confirm-title">{title}</h2>
            <p className="muted">{message}</p>
          </div>
          <AlertTriangle aria-hidden="true" color="#b7791f" />
        </div>
        <div className="modal-footer">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
