import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { LogIn, UserPlus } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { extractApiError } from '../utils/errors'

interface AuthFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, login, registerAndLogin } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated) {
    return <Navigate to="/reservations" replace />
  }

  async function onSubmit(values: AuthFormValues) {
    setError(null)
    try {
      if (mode === 'register') {
        await registerAndLogin(values)
      } else {
        await login(values)
      }
      navigate('/reservations', { replace: true })
    } catch (apiError) {
      setError(extractApiError(apiError, 'Nao foi possivel autenticar. Verifique os dados e tente novamente.'))
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Banana Ltda Reservas">
        <div className="brand-lockup">
          <span className="brand-mark">B</span>
          <span>Banana Ltda.</span>
        </div>
        <div>
          <h1>Agenda de salas para equipes da Banana Ltda.</h1>
          <p>Encontre uma sala disponivel, registre o responsavel e mantenha a agenda organizada entre matriz e filiais.</p>
        </div>
        <div className="auth-highlights">
          <div className="auth-highlight">
            <strong>Locais</strong>
            <span>Matriz, filiais e salas em uma unica agenda.</span>
          </div>
          <div className="auth-highlight">
            <strong>Cafe</strong>
            <span>Informe a quantidade quando houver coffee break.</span>
          </div>
          <div className="auth-highlight">
            <strong>Horarios</strong>
            <span>Reserve sem sobrepor compromissos da mesma sala.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <p className="muted">
            {mode === 'login' ? 'Use seu e-mail e senha para acessar as reservas.' : 'Crie uma conta e entre automaticamente.'}
          </p>

          <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate style={{ marginTop: 24 }}>
            {error ? <div className="alert alert-error">{error}</div> : null}

            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Informe o e-mail.',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Informe um e-mail valido.' },
                })}
              />
              {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...register('password', {
                  required: 'Informe a senha.',
                  minLength: { value: 6, message: 'A senha precisa ter pelo menos 6 caracteres.' },
                })}
              />
              {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
            </div>

            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {mode === 'login' ? <LogIn aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
              {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar e entrar'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Ainda nao tem conta?' : 'Ja tem conta?'}
            <button className="link-button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
