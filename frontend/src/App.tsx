import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from './app/queryClient'
import { ProtectedRoute } from './app/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AcceptInvitePage } from './features/family/AcceptInvitePage'
import { PrivacyPolicyPage } from './features/legal/PrivacyPolicyPage'
import { TermsPage } from './features/legal/TermsPage'
import { MyDataPage } from './features/privacy/MyDataPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/registrar" element={<RegisterPage />} />
          <Route path="/convite/:token" element={<AcceptInvitePage />} />
          <Route path="/privacidade" element={<PrivacyPolicyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-dados"
            element={
              <ProtectedRoute>
                <MyDataPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
