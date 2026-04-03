import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth, setSession } from '../api'

export default function Login() {
    const [tab, setTab] = useState('client')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const nav = useNavigate()

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        try {
            const data = await Auth.login(username, password)
            setSession(data)
            if (data.role === 'Admin') nav('/admin')
            else if (data.role === 'Trainer') nav('/trainer')
            else nav('/client')
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-box">
                <Link to="/" className="btn-back">← Back to Home</Link>
                <h2>Welcome Back</h2>
                <div className="tab-bar">
                    <button className={`tab ${tab === 'client' ? 'active' : ''}`} onClick={() => setTab('client')}>Client Login</button>
                    <button className={`tab ${tab === 'trainer' ? 'active' : ''}`} onClick={() => setTab('trainer')}>Trainer / Admin</button>
                </div>
                <form onSubmit={handleLogin}>
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                    <button type="submit" className="btn btn-gold btn-full">Log In</button>
                </form>
                {error && <p className="error-text">{error}</p>}
                <p className="switch-link">
                    New here? <Link to="/register">Register as Client</Link> | <Link to="/trainer-register">Register as Trainer</Link>
                </p>
            </div>
        </div>
    )
}
