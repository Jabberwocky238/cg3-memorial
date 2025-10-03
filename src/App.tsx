import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import HomePage from './pages/Home'
import AuthPage from './pages/Auth'
import Layout from './pages/Layout'
import DashboardPage from './pages/Dashboard'
import ProjectsPage from './pages/Projects'
import TasksPage from './pages/Tasks'
import ReportingPage from './pages/Reporting'
import UsersPage from './pages/Users'
import { FirebaseProvider, firebaseValue } from './contexts/firebase'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path='dashboard' element={<DashboardPage />} />
        <Route path='projects' element={<ProjectsPage />} />
        <Route path='tasks' element={<TasksPage />} />
        <Route path='reporting' element={<ReportingPage />} />
        <Route path='users' element={<UsersPage />} />
      </Route>
      <Route path='/auth' element={<AuthPage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider value={firebaseValue}>
        <AppRoutes />
      </FirebaseProvider>
    </BrowserRouter>
  )
}

export default App
