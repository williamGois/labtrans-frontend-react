import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/LoginPage'
import { ReservationsPage } from '../pages/ReservationsPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/reservations" element={<ReservationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/reservations" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
