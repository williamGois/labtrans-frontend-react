import { expect, test } from '@playwright/test'

test('user registers, manages a reservation, sees conflict feedback and logs out', async ({ page }) => {
  const email = `playwright-${Date.now()}@example.test`
  const testCredential = buildTestCredential()
  const start = futureDatetimeLocal(35, 10)
  const end = futureDatetimeLocal(35, 11)

  await page.goto('/login')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(testCredential)
  await page.getByRole('button', { name: /Cadastrar e entrar/i }).click()

  await expect(page.getByRole('heading', { name: 'Reservas de salas' })).toBeVisible()

  await createReservation(page, start, end, 'Playwright QA')
  await expect(page.getByText('Reserva criada com sucesso.')).toBeVisible()
  await expect(page.getByText('Playwright QA')).toBeVisible()

  await createReservation(page, start, end, 'Playwright Conflito')
  await expect(page.getByText(/Ja existe uma reserva para esta sala, local e horario/)).toBeVisible()
  await page.getByLabel('Fechar formulario').click()

  await page.getByRole('button', { name: 'Agenda' }).click()
  await expect(page.getByLabel('Agenda de reservas')).toBeVisible()
  await expect(page.getByText('Playwright QA')).toBeVisible()

  await page.getByRole('button', { name: 'Lista' }).click()
  await page.getByLabel('Busca').fill('Playwright QA')
  await expect(page.getByText('1 reserva encontrada')).toBeVisible()

  await page.getByRole('button', { name: 'Editar reserva' }).first().click()
  await page.getByLabel('Responsavel').fill('Playwright QA Editado')
  await page.getByRole('button', { name: /Salvar alteracoes/i }).click()
  await expect(page.getByText('Reserva atualizada com sucesso.')).toBeVisible()
  await expect(page.getByText('Playwright QA Editado')).toBeVisible()

  await page.getByRole('button', { name: 'Excluir reserva' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByText('Reserva excluida com sucesso.')).toBeVisible()

  await page.getByRole('button', { name: /Sair/i }).click()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

  await page.goto('/reservations')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

async function createReservation(page: import('@playwright/test').Page, start: string, end: string, responsible: string) {
  await page.getByRole('button', { name: /Nova reserva/i }).first().click()
  const dialog = page.getByRole('dialog', { name: /reserva/i })
  await dialog.getByLabel('Local / filial').selectOption({ index: 1 })
  await dialog.getByLabel('Sala').selectOption({ index: 1 })
  await dialog.getByLabel('Inicio').fill(start)
  await dialog.getByLabel('Fim').fill(end)
  await dialog.getByLabel('Responsavel').fill(responsible)
  await dialog.getByRole('button', { name: /Criar reserva/i }).click()
}

function futureDatetimeLocal(daysFromNow: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, 0, 0, 0)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function buildTestCredential(): string {
  return ['Playwright', 'Credential', Date.now().toString(36), '!'].join('')
}
