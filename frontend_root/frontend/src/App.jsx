import './App.css'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import ProtectedRoute from './components/ProtectedRoutes'
import GuestRoute from './components/GuestRoute'
import VerifyEmail from './pages/VerifyEmail'
import EmailNotVerified from './pages/EmailNotVerified'
import CreateAd from './pages/CreateAd'
import ResetPasswordRequest from './pages/ResetPasswordRequest'
import ResetPasswordConfirm from './pages/ResetPasswordConfirm'
import NotifyForEmailVerification from './pages/NotifyForEmailVerification'
import AdDetail from './pages/AdDetail'
import EditAd from './pages/EditAd'
import SavedAds from './pages/SavedAds'
import LanguageSwitcher from './components/LanguageSwitcher'

function App() {
  return (
    <>
      <LanguageSwitcher />
      <Routes>
        <Route element={<MainLayout/>}>
          <Route path="/" element={<Home/>}/>
        </Route>

        <Route element={<GuestRoute/>}>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/reset-password/request" element={<ResetPasswordRequest/>}/>
          <Route path="/reset-password/:token" element={<ResetPasswordConfirm/>}/>
        </Route>

        <Route element={<ProtectedRoute/>}>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/edit-profile" element={<EditProfile/>} />
          <Route path="/advertisements/create" element={<CreateAd/>} />
          <Route path="/advertisements/:uuid/edit" element={<EditAd/>}/>
          <Route path="/saved" element={<SavedAds/>}/>
        </Route>

        <Route path="/advertisements/:uuid" element={<AdDetail/>}/>
        <Route path="/verify-email/:token" element={<VerifyEmail/>} />
        <Route path="/profiles/:username" element={<Profile/>}/>
        <Route path="/email-not-verified" element={<EmailNotVerified/>}/>
        <Route path="/verify-email-notification" element={<NotifyForEmailVerification/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </>
  )
}

export default App