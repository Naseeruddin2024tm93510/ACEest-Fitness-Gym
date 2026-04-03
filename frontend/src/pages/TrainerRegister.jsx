import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../api'

export default function TrainerRegister() {
    const nav = useNavigate()
    const [form, setForm] = useState({ username: '', password: '', name: '', age: '', phone: '', experience: '', certifications: '' })
    const [error, setError] = useState('')

    function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        try {
            await Auth.registerTrainer({ ...form, age: parseInt(form.age) || null, experience: parseInt(form.experience) || 0 })
            alert('Trainer registration successful! Please login.')
            nav('/login')
        } catch (err) { setError(err.message) }
    }

    return (
        <div className="auth-page">
            <div className="auth-box" style={{ maxWidth: 480 }}>
                <Link to="/" className="btn-back">← Back to Home</Link>
                <h2>Trainer Registration</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <input placeholder="Username *" value={form.username} onChange={e => set('username', e.target.value)} required />
                        <input type="password" placeholder="Password *" value={form.password} onChange={e => set('password', e.target.value)} required />
                        <input placeholder="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} required />
                        <input type="number" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)} />
                        <input placeholder="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        <input type="number" placeholder="Years of Experience" value={form.experience} onChange={e => set('experience', e.target.value)} />
                        <textarea className="full-w" placeholder="Certifications (e.g., ACE, NASM, ISSA...)" value={form.certifications} onChange={e => set('certifications', e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-gold btn-full">Register as Trainer</button>
                </form>
                {error && <p className="error-text">{error}</p>}
                <p className="switch-link">Already registered? <Link to="/login">Login here</Link></p>
            </div>
        </div>
    )
}
