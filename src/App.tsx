import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import HomePage from './pages/Home'
import AuthPage from './pages/Auth'
import Layout from './pages/Layout'
import { FirebaseProvider } from './hooks/use-firebase'
import EditPage from './pages/Edit'
import ExplorePage from './pages/Explore'
import ArticlePage from './pages/Article'
import ProfilePage from './pages/Profile'
import { ArweaveProvider } from './hooks/use-arweave'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path='/' index element={<HomePage />} />
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/profile' element={<ProfilePage />} />
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
      <FirebaseProvider>
        <ArweaveProvider>
          <AppRoutes />
        </ArweaveProvider>
      </FirebaseProvider>
    </BrowserRouter>
  )
}

export default App
