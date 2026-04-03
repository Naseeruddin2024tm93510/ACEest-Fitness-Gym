import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import TrainerRegister from './pages/TrainerRegister'
import AdminDashboard from './pages/AdminDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import ClientDashboard from './pages/ClientDashboard'

function getSession() {
    const s = localStorage.getItem('aceest_session')
    return s ? JSON.parse(s) : null
}

function ProtectedRoute({ children, role }) {
    const s = getSession()
    if (!s) return <Navigate to="/login" />
    if (role && s.role !== role) return <Navigate to="/login" />
    return children
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trainer-register" element={<TrainerRegister />} />
            <Route path="/admin/*" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/trainer/*" element={<ProtectedRoute role="Trainer"><TrainerDashboard /></ProtectedRoute>} />
            <Route path="/client/*" element={<ProtectedRoute role="Client"><ClientDashboard /></ProtectedRoute>} />
        </Routes>
    )
}
