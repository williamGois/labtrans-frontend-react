import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, Edit2, Filter, List, LogOut, RefreshCw, Search, Trash2, Users, XCircle } from 'lucide-react'
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
import { formatDateTime, formatTime } from '../utils/date'
import { extractApiError } from '../utils/errors'
import {
  emptyReservationFilters,
  filterReservations,
  groupReservationsByDay,
  hasActiveReservationFilters,
  type ReservationFilters,
} from '../utils/reservationFilters'

type DeleteState = { kind: 'single'; reservation: Reservation } | { kind: 'bulk' } | null
type ViewMode = 'table' | 'calendar'

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
  const [filters, setFilters] = useState<ReservationFilters>(emptyReservationFilters)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const filteredRoomsForFilter = useMemo(() => {
    const locationId = Number(filters.locationId)
    return rooms.filter((room) => room.active && (!locationId || room.location_id === locationId))
  }, [filters.locationId, rooms])
  const filteredReservations = useMemo(() => filterReservations(reservations, filters), [filters, reservations])
  const calendarGroups = useMemo(() => groupReservationsByDay(filteredReservations), [filteredReservations])
  const hasFilters = useMemo(() => hasActiveReservationFilters(filters), [filters])
  const selectedCount = selectedIds.size
  const allSelected = useMemo(
    () => filteredReservations.length > 0 && filteredReservations.every((reservation) => selectedIds.has(reservation.id)),
    [filteredReservations, selectedIds],
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

    setSelectedIds(new Set(filteredReservations.map((reservation) => reservation.id)))
  }

  function updateFilter<K extends keyof ReservationFilters>(key: K, value: ReservationFilters[K]) {
    setSelectedIds(new Set())
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'locationId') {
        next.roomId = ''
      }
      return next
    })
  }

  function clearFilters() {
    setSelectedIds(new Set())
    setFilters(emptyReservationFilters)
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
          <p className="muted">{buildReservationCountLabel(filteredReservations.length, reservations.length, hasFilters)}</p>
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

        <section className="filters-panel" aria-label="Filtros de reservas">
          <div className="filters-title">
            <Filter aria-hidden="true" />
            <span>Filtros</span>
          </div>
          <div className="filters-grid">
            <div className="field">
              <label htmlFor="filter-location">Local</label>
              <select id="filter-location" value={filters.locationId} onChange={(event) => updateFilter('locationId', event.target.value)}>
                <option value="">Todos</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="filter-room">Sala</label>
              <select id="filter-room" value={filters.roomId} onChange={(event) => updateFilter('roomId', event.target.value)}>
                <option value="">Todas</option>
                {filteredRoomsForFilter.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="filter-from">De</label>
              <input id="filter-from" type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="filter-to">Ate</label>
              <input id="filter-to" type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
            </div>
            <div className="field field-search">
              <label htmlFor="filter-search">Busca</label>
              <div className="input-with-icon">
                <Search aria-hidden="true" />
                <input
                  id="filter-search"
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Responsavel, sala ou descricao"
                />
              </div>
            </div>
          </div>
          <div className="filters-actions">
            <div className="segmented-control" aria-label="Modo de visualizacao">
              <button className={viewMode === 'table' ? 'active' : ''} type="button" onClick={() => setViewMode('table')}>
                <List aria-hidden="true" />
                Lista
              </button>
              <button className={viewMode === 'calendar' ? 'active' : ''} type="button" onClick={() => setViewMode('calendar')}>
                <CalendarDays aria-hidden="true" />
                Agenda
              </button>
            </div>
            <button className="button button-secondary" type="button" onClick={clearFilters} disabled={!hasFilters}>
              <XCircle aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        </section>

        {filteredReservations.length === 0 && !loading ? (
          <div className="empty-state">
            <Users size={42} aria-hidden="true" />
            <div>
              <strong>{reservations.length === 0 ? 'Nenhuma reserva cadastrada' : 'Nenhuma reserva encontrada'}</strong>
              <p>{reservations.length === 0 ? 'Crie a primeira reserva para visualizar a agenda.' : 'Ajuste os filtros para ampliar a busca.'}</p>
            </div>
            <button className="button button-primary" type="button" onClick={openCreateForm}>
              <CalendarPlus aria-hidden="true" />
              Nova reserva
            </button>
          </div>
        ) : (
          viewMode === 'calendar' ? (
            <div className="calendar-view" aria-label="Agenda de reservas">
              {calendarGroups.map((group) => (
                <section className="calendar-day" key={group.dateKey}>
                  <div className="calendar-day-header">
                    <span>{group.label}</span>
                    <strong>{group.reservations.length}</strong>
                  </div>
                  <div className="calendar-items">
                    {group.reservations.map((reservation) => (
                      <article className="calendar-item" key={reservation.id}>
                        <div className="calendar-time">
                          <span>{formatTime(reservation.start_datetime)}</span>
                          <span>{formatTime(reservation.end_datetime)}</span>
                        </div>
                        <div>
                          <strong>{reservation.room.name}</strong>
                          <p>{reservation.location.name}</p>
                          <span>{reservation.responsible}</span>
                        </div>
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
                      </article>
                    ))}
                  </div>
                </section>
              ))}
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
                {filteredReservations.map((reservation) => (
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
          )
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

function buildReservationCountLabel(filteredCount: number, totalCount: number, hasFilters: boolean): string {
  if (!hasFilters) {
    return totalCount === 1 ? '1 reserva cadastrada' : `${totalCount} reservas cadastradas`
  }

  const filteredLabel = filteredCount === 1 ? '1 reserva encontrada' : `${filteredCount} reservas encontradas`
  return `${filteredLabel} de ${totalCount}`
}
