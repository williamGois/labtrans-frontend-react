import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { CalendarPlus, Save, X } from 'lucide-react'
import type { Location, Reservation, ReservationPayload, Room } from '../types'
import { datetimeLocalToIso, toDatetimeLocal } from '../utils/date'

interface ReservationFormProps {
  reservation?: Reservation | null
  locations: Location[]
  rooms: Room[]
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: ReservationPayload) => Promise<void>
}

interface FormValues {
  location_id: string
  room_id: string
  start_datetime: string
  end_datetime: string
  responsible: string
  coffee_required: boolean
  people_count: string
  description: string
}

function toFormValues(reservation?: Reservation | null): FormValues {
  return {
    location_id: reservation?.location_id ? String(reservation.location_id) : '',
    room_id: reservation?.room_id ? String(reservation.room_id) : '',
    start_datetime: toDatetimeLocal(reservation?.start_datetime),
    end_datetime: toDatetimeLocal(reservation?.end_datetime),
    responsible: reservation?.responsible ?? '',
    coffee_required: reservation?.coffee_required ?? false,
    people_count: reservation?.people_count ? String(reservation.people_count) : '',
    description: reservation?.description ?? '',
  }
}

export function ReservationForm({ reservation, locations, rooms, loading = false, onCancel, onSubmit }: ReservationFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: toFormValues(reservation),
  })

  const locationId = useWatch({ control, name: 'location_id' })
  const roomId = useWatch({ control, name: 'room_id' })
  const coffeeRequired = useWatch({ control, name: 'coffee_required' })
  const startDateTime = useWatch({ control, name: 'start_datetime' })

  const filteredRooms = useMemo(() => {
    const parsedLocationId = Number(locationId)
    return rooms.filter((room) => room.active && (!parsedLocationId || room.location_id === parsedLocationId))
  }, [locationId, rooms])

  useEffect(() => {
    reset(toFormValues(reservation))
  }, [reservation, reset])

  useEffect(() => {
    if (roomId && !filteredRooms.some((room) => String(room.id) === roomId)) {
      setValue('room_id', '')
    }
  }, [filteredRooms, roomId, setValue])

  async function submit(values: FormValues) {
    await onSubmit({
      location_id: Number(values.location_id),
      room_id: Number(values.room_id),
      start_datetime: datetimeLocalToIso(values.start_datetime),
      end_datetime: datetimeLocalToIso(values.end_datetime),
      responsible: values.responsible.trim(),
      coffee_required: values.coffee_required,
      people_count: values.coffee_required ? Number(values.people_count) : null,
      description: values.description.trim() ? values.description.trim() : null,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="reservation-form-title">
        <div className="modal-header">
          <div>
            <h2 id="reservation-form-title">{reservation ? 'Editar reserva' : 'Nova reserva'}</h2>
            <p className="muted">Informe local, sala, horario e responsavel.</p>
          </div>
          <button className="button button-icon" type="button" onClick={onCancel} aria-label="Fechar formulario">
            <X aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="location_id">Local / filial</label>
                <select id="location_id" {...register('location_id', { required: 'Selecione o local.' })}>
                  <option value="">Selecione</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.location_id ? <span className="field-error">{errors.location_id.message}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="room_id">Sala</label>
                <select id="room_id" {...register('room_id', { required: 'Selecione a sala.' })}>
                  <option value="">Selecione</option>
                  {filteredRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.capacity} pessoas
                    </option>
                  ))}
                </select>
                {errors.room_id ? <span className="field-error">{errors.room_id.message}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="start_datetime">Inicio</label>
                <input id="start_datetime" type="datetime-local" {...register('start_datetime', { required: 'Informe o inicio.' })} />
                {errors.start_datetime ? <span className="field-error">{errors.start_datetime.message}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="end_datetime">Fim</label>
                <input
                  id="end_datetime"
                  type="datetime-local"
                  {...register('end_datetime', {
                    required: 'Informe o fim.',
                    validate: (value) =>
                      !startDateTime || new Date(value).getTime() > new Date(startDateTime).getTime() || 'Fim precisa ser maior que o inicio.',
                  })}
                />
                {errors.end_datetime ? <span className="field-error">{errors.end_datetime.message}</span> : null}
              </div>

              <div className="field field-wide">
                <label htmlFor="responsible">Responsavel</label>
                <input id="responsible" {...register('responsible', { required: 'Informe o responsavel.' })} />
                {errors.responsible ? <span className="field-error">{errors.responsible.message}</span> : null}
              </div>

              <label className="checkbox-row">
                <input type="checkbox" {...register('coffee_required')} />
                <span>Cafe solicitado</span>
              </label>

              <div className="field">
                <label htmlFor="people_count">Quantidade de pessoas</label>
                <input
                  id="people_count"
                  type="number"
                  min="1"
                  disabled={!coffeeRequired}
                  {...register('people_count', {
                    validate: (value) => !coffeeRequired || Number(value) > 0 || 'Informe a quantidade de pessoas para cafe.',
                  })}
                />
                {errors.people_count ? <span className="field-error">{errors.people_count.message}</span> : null}
              </div>

              <div className="field field-wide">
                <label htmlFor="description">Descricao</label>
                <textarea id="description" {...register('description')} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="button button-secondary" type="button" onClick={onCancel} disabled={loading || isSubmitting}>
              Cancelar
            </button>
            <button className="button button-primary" type="submit" disabled={loading || isSubmitting}>
              {reservation ? <Save aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
              {loading || isSubmitting ? 'Salvando...' : reservation ? 'Salvar alteracoes' : 'Criar reserva'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
