import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import HomePage from './pages/Home'
import AuthPage from './pages/Auth'
import Layout from './pages/Layout'
import { FirebaseProvider } from './hooks/use-firebase'
import EditPage from './pages/Edit'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EditPage />} />
        <Route path='/edit/:aid' element={<EditPage />} />
      </Route>
      <Route path='/auth' element={<AuthPage />} />
      {/* fallback */}
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <AppRoutes />
      </FirebaseProvider>
    </BrowserRouter>
  )
}

export default App
