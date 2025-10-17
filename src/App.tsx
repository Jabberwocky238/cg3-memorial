import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom'

import { ThemeProvider } from './hooks/use-theme'
import { lazy } from 'react'
import FirebaseProvider from './hooks/use-firebase'
import { ErrorBoundary } from './hooks/use-error'
import { ArweaveProvider } from './hooks/use-arweave'
import { CashierProvider } from './hooks/use-cashier'

const Layout = lazy(() => import('./Layout'))
const HomePage = lazy(() => import('./pages/Home'))
const AuthPage = lazy(() => import('./pages/Auth'))
const EditPage = lazy(() => import('./pages/Edit'))
const ExplorePage = lazy(() => import('./pages/Explore'))
const ArticlePage = lazy(() => import('./pages/Article'))
const ProfilePage = lazy(() => import('./pages/Profile'))

// import Layout from './Layout'
// import HomePage from './pages/Home'
// import AuthPage from './pages/Auth'
// import EditPage from './pages/Edit'
// import ExplorePage from './pages/Explore'
// import ArticlePage from './pages/Article'
// import ProfilePage from './pages/Profile'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path='/' index element={<Navigate to="/explore" />} />
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/edit' element={<EditPage />} />
        <Route path='/edit/:aid' element={<EditPage />} />
        <Route path='/article/:aid' element={<ArticlePage />} />
      </Route>
      <Route path='/auth' element={<AuthPage />} />
      {/* fallback */}
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <FirebaseProvider>
            <ArweaveProvider>
              <CashierProvider>
                <AppRoutes />
              </CashierProvider>
            </ArweaveProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
