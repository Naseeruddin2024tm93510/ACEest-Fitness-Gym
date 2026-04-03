import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../api'

export default function Register() {
    const nav = useNavigate()
    const [form, setForm] = useState({ username: '', password: '', name: '', age: '', phone: '', email: '', height: '', weight: '', goal: '', plan_type: 'General', body_details: '' })
    const [error, setError] = useState('')

    function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        try {
            await Auth.register({ ...form, age: parseInt(form.age) || null, height: parseFloat(form.height) || null, weight: parseFloat(form.weight) || null })
            alert('Registration successful! Please login.')
            nav('/login')
        } catch (err) { setError(err.message) }
    }

    return (
        <div className="auth-page">
            <div className="auth-box" style={{ maxWidth: 520 }}>
                <Link to="/" className="btn-back">← Back to Home</Link>
                <h2>Join ACEest</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <input placeholder="Username *" value={form.username} onChange={e => set('username', e.target.value)} required />
                        <input type="password" placeholder="Password *" value={form.password} onChange={e => set('password', e.target.value)} required />
                        <input placeholder="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} required />
                        <input type="number" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)} />
                        <input placeholder="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        <input type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
                        <input type="number" step="0.1" placeholder="Height (cm)" value={form.height} onChange={e => set('height', e.target.value)} />
                        <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={e => set('weight', e.target.value)} />
                        <input className="full-w" placeholder="Fitness Goal (e.g., Lose 10kg, Build muscle)" value={form.goal} onChange={e => set('goal', e.target.value)} />
                        <select className="full-w" value={form.plan_type} onChange={e => set('plan_type', e.target.value)}>
                            <option value="General">General — ₹999/mo</option>
                            <option value="With Trainer">With Trainer — ₹2,499/mo</option>
                            <option value="Advanced Trainer">Advanced Trainer — ₹4,999/mo</option>
                            <option value="Competition">Competition — ₹9,999/mo</option>
                        </select>
                        <textarea className="full-w" placeholder="Body details, medical conditions, injuries..." value={form.body_details} onChange={e => set('body_details', e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-gold btn-full">Register</button>
                </form>
                {error && <p className="error-text">{error}</p>}
                <p className="switch-link">Already a member? <Link to="/login">Login here</Link></p>
            </div>
        </div>
    )
}
