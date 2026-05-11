import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarPlus, Edit2, LogOut, RefreshCw, Trash2, Users } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import {
  bulkDeleteReservations,
  createReservation,
  deleteReservation,
  fetchLocations,
  fetchReservations,
  fetchRooms,
  updateReservation,
} from '../api/reservationsClient'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ReservationForm } from '../components/ReservationForm'
import type { Location, Reservation, ReservationPayload, Room } from '../types'
import { formatDateTime } from '../utils/date'
import { extractApiError } from '../utils/errors'

type DeleteState = { kind: 'single'; reservation: Reservation } | { kind: 'bulk' } | null

export function ReservationsPage() {
  const { token, user, logout } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  const selectedCount = selectedIds.size
  const allSelected = useMemo(
    () => reservations.length > 0 && reservations.every((reservation) => selectedIds.has(reservation.id)),
    [reservations, selectedIds],
  )

  const loadData = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [nextLocations, nextRooms, nextReservations] = await Promise.all([
        fetchLocations(token),
        fetchRooms(token),
        fetchReservations(token),
      ])
      setLocations(nextLocations)
      setRooms(nextRooms)
      setReservations(nextReservations)
      setSelectedIds(new Set())
    } catch (apiError) {
      setError(extractApiError(apiError, 'Nao foi possivel carregar as reservas.'))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  function openCreateForm() {
    setEditingReservation(null)
    setFormOpen(true)
    setError(null)
    setMessage(null)
  }

  function openEditForm(reservation: Reservation) {
    setEditingReservation(reservation)
    setFormOpen(true)
    setError(null)
    setMessage(null)
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAllSelected() {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }

    setSelectedIds(new Set(reservations.map((reservation) => reservation.id)))
  }

  async function handleSubmitReservation(payload: ReservationPayload) {
    if (!token) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (editingReservation) {
        await updateReservation(token, editingReservation.id, payload)
        setMessage('Reserva atualizada com sucesso.')
      } else {
        await createReservation(token, payload)
        setMessage('Reserva criada com sucesso.')
      }

      setFormOpen(false)
      setEditingReservation(null)
      await loadData()
    } catch (apiError) {
      setError(extractApiError(apiError, 'Nao foi possivel salvar a reserva.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!token || !deleteState) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (deleteState.kind === 'single') {
        await deleteReservation(token, deleteState.reservation.id)
        setMessage('Reserva excluida com sucesso.')
      } else {
        const deleted = await bulkDeleteReservations(token, Array.from(selectedIds))
        setMessage(`${deleted} reserva(s) excluida(s).`)
      }

      setDeleteState(null)
      await loadData()
    } catch (apiError) {
      setError(extractApiError(apiError, 'Nao foi possivel excluir a reserva.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">B</span>
          <span>Banana Reservas</span>
        </div>
        <div className="topbar-actions">
          <span>{user?.email}</span>
          <button className="button button-secondary" type="button" onClick={logout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      {loading ? <div className="loading-bar" aria-label="Carregando" /> : null}

      <main className="content">
        <section className="page-header">
          <div>
            <h1>Reservas de salas</h1>
            <p className="muted">Gerencie locais, salas e horarios evitando conflitos de agenda.</p>
          </div>
          <div className="button-row">
            <button className="button button-secondary" type="button" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw aria-hidden="true" />
              Atualizar
            </button>
            <button className="button button-primary" type="button" onClick={openCreateForm}>
              <CalendarPlus aria-hidden="true" />
              Nova reserva
            </button>
          </div>
        </section>

        {error ? <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div> : null}
        {message ? <div className="alert alert-success" style={{ marginBottom: 14 }}>{message}</div> : null}

        <div className="toolbar">
          <p className="muted">
            {reservations.length === 1 ? '1 reserva cadastrada' : `${reservations.length} reservas cadastradas`}
          </p>
          <button
            className="button button-danger"
            type="button"
            onClick={() => setDeleteState({ kind: 'bulk' })}
            disabled={selectedCount === 0}
          >
            <Trash2 aria-hidden="true" />
            Excluir selecionadas ({selectedCount})
          </button>
        </div>

        {reservations.length === 0 && !loading ? (
          <div className="empty-state">
            <Users size={42} aria-hidden="true" />
            <div>
              <strong>Nenhuma reserva cadastrada</strong>
              <p>Crie a primeira reserva para visualizar a agenda.</p>
            </div>
            <button className="button button-primary" type="button" onClick={openCreateForm}>
              <CalendarPlus aria-hidden="true" />
              Nova reserva
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allSelected} onChange={toggleAllSelected} aria-label="Selecionar todas" />
                  </th>
                  <th>Local</th>
                  <th>Sala</th>
                  <th>Inicio</th>
                  <th>Fim</th>
                  <th>Responsavel</th>
                  <th>Descricao</th>
                  <th style={{ textAlign: 'right' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td data-label="Selecionar">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(reservation.id)}
                        onChange={() => toggleSelected(reservation.id)}
                        aria-label={`Selecionar reserva ${reservation.id}`}
                      />
                    </td>
                    <td data-label="Local">{reservation.location.name}</td>
                    <td data-label="Sala">{reservation.room.name}</td>
                    <td data-label="Inicio">{formatDateTime(reservation.start_datetime)}</td>
                    <td data-label="Fim">{formatDateTime(reservation.end_datetime)}</td>
                    <td data-label="Responsavel">{reservation.responsible}</td>
                    <td className="description-cell" data-label="Descricao">
                      {reservation.description || '-'}
                    </td>
                    <td data-label="Acoes">
                      <div className="row-actions">
                        <button className="button button-icon" type="button" onClick={() => openEditForm(reservation)} aria-label="Editar reserva">
                          <Edit2 aria-hidden="true" />
                        </button>
                        <button
                          className="button button-icon"
                          type="button"
                          onClick={() => setDeleteState({ kind: 'single', reservation })}
                          aria-label="Excluir reserva"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {formOpen ? (
        <ReservationForm
          reservation={editingReservation}
          locations={locations}
          rooms={rooms}
          loading={saving}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmitReservation}
        />
      ) : null}

      {deleteState ? (
        <ConfirmDialog
          title={deleteState.kind === 'single' ? 'Excluir reserva?' : 'Excluir reservas selecionadas?'}
          message={
            deleteState.kind === 'single'
              ? `Esta acao removera a reserva de ${deleteState.reservation.responsible}.`
              : `Esta acao removera ${selectedCount} reserva(s) selecionada(s).`
          }
          confirmLabel="Excluir"
          loading={saving}
          onCancel={() => setDeleteState(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  )
}
