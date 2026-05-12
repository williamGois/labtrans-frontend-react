import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../App'
import { ReservationForm } from '../components/ReservationForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Location, Room } from '../types'
import { createReservation, fetchLocations, fetchReservations, fetchRooms } from '../api/reservationsClient'
import { loginUser } from '../api/authClient'

vi.mock('../api/authClient', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getMe: vi.fn(),
}))

vi.mock('../api/reservationsClient', () => ({
  fetchLocations: vi.fn(),
  fetchRooms: vi.fn(),
  fetchReservations: vi.fn(),
  createReservation: vi.fn(),
  updateReservation: vi.fn(),
  deleteReservation: vi.fn(),
  bulkDeleteReservations: vi.fn(),
}))

const locations: Location[] = [
  { id: 1, name: 'Matriz Florianopolis', address: 'Endereco 1', created_at: '2026-05-11T00:00:00Z', updated_at: null },
]

const rooms: Room[] = [
  { id: 1, location_id: 1, name: 'Sala Azul', capacity: 8, active: true, created_at: '2026-05-11T00:00:00Z', updated_at: null },
]

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.history.pushState({}, '', '/')
  vi.clearAllMocks()
})

function mockEmptyReservations() {
  vi.mocked(fetchLocations).mockResolvedValue(locations)
  vi.mocked(fetchRooms).mockResolvedValue(rooms)
  vi.mocked(fetchReservations).mockResolvedValue([])
}

describe('App auth flow', () => {
  test('renders login screen', () => {
    window.history.pushState({}, '', '/login')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  test('validates required login fields', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
  })

  test('renders register mode and validates required fields', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    await user.click(screen.getByRole('button', { name: /Cadastrar e entrar/i }))

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
  })

  test('stores token and redirects after login', async () => {
    const user = userEvent.setup()
    mockEmptyReservations()
    vi.mocked(loginUser).mockResolvedValue({
      accessToken: 'token-valido',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 'user-1', email: 'usuario@email.com' },
    })
    window.history.pushState({}, '', '/login')
    render(<App />)

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.type(screen.getByLabelText('Senha'), ['Unit', 'Credential', '123', '!'].join(''))
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => expect(localStorage.getItem('labtrans_access_token')).toBe('token-valido'))
    expect(await screen.findByRole('heading', { name: 'Reservas de salas' })).toBeInTheDocument()
  })

  test('protects reservations route without token', () => {
    window.history.pushState({}, '', '/reservations')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('Reservation UI', () => {
  test('renders empty reservations list with authenticated user', async () => {
    localStorage.setItem('labtrans_access_token', 'token-valido')
    localStorage.setItem('labtrans_user', JSON.stringify({ id: 'user-1', email: 'usuario@email.com' }))
    mockEmptyReservations()
    window.history.pushState({}, '', '/reservations')

    render(<App />)

    expect(await screen.findByText('Nenhuma reserva cadastrada')).toBeInTheDocument()
  })

  test('requires people count when coffee is checked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<ReservationForm locations={locations} rooms={rooms} onCancel={vi.fn()} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Local / filial'), '1')
    await user.selectOptions(screen.getByLabelText('Sala'), '1')
    await user.type(screen.getByLabelText('Inicio'), '2026-05-12T09:00')
    await user.type(screen.getByLabelText('Fim'), '2026-05-12T10:00')
    await user.type(screen.getByLabelText('Responsavel'), 'Maria Silva')
    await user.click(screen.getByLabelText('Cafe solicitado'))
    await user.click(screen.getByRole('button', { name: /Criar reserva/i }))

    expect(await screen.findByText('Informe a quantidade de pessoas para cafe.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('shows friendly conflict message returned by API', async () => {
    const user = userEvent.setup()
    localStorage.setItem('labtrans_access_token', 'token-valido')
    localStorage.setItem('labtrans_user', JSON.stringify({ id: 'user-1', email: 'usuario@email.com' }))
    mockEmptyReservations()
    vi.mocked(createReservation).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Ja existe uma reserva para esta sala, local e horario.' } },
    })
    window.history.pushState({}, '', '/reservations')
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Nova reserva/i }))
    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Local / filial'), '1')
    await user.selectOptions(within(dialog).getByLabelText('Sala'), '1')
    await user.type(within(dialog).getByLabelText('Inicio'), '2026-05-12T09:00')
    await user.type(within(dialog).getByLabelText('Fim'), '2026-05-12T10:00')
    await user.type(within(dialog).getByLabelText('Responsavel'), 'Maria Silva')
    await user.click(within(dialog).getByRole('button', { name: /Criar reserva/i }))

    expect(await screen.findByText('Ja existe uma reserva para esta sala, local e horario.')).toBeInTheDocument()
  })

  test('confirm dialog requires explicit confirmation before deleting', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog title="Excluir reserva?" message="Confirme a exclusao." onConfirm={onConfirm} onCancel={onCancel} />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
