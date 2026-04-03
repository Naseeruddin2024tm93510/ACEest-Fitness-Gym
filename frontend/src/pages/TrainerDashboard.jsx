import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trainers, Clients, getSession, clearSession, getGreeting } from '../api'

export default function TrainerDashboard() {
    const [tab, setTab] = useState('clients')
    const [viewClientId, setViewClientId] = useState(null)
    const s = getSession()
    const nav = useNavigate()

    function logout() { clearSession(); nav('/') }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="logo">ACE<span>est</span><small>Trainer</small></div>
                <button className={`nav-btn ${tab === 'clients' ? 'active' : ''}`} onClick={() => { setTab('clients'); setViewClientId(null); }}>👥 My Clients</button>
                <button className={`nav-btn ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}>💬 Feedback</button>
                <button className={`nav-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>⚙️ My Profile</button>
                {viewClientId && <button className="nav-btn active" onClick={() => setTab('client-detail')}>👤 Client Detail</button>}
                <button className="nav-btn logout" onClick={logout}>🚪 Logout</button>
            </aside>
            <main className="main">
                <div className="greeting"><h1>{getGreeting()}, {s?.name || 'Trainer'}</h1><p>Manage your clients and training programs.</p></div>
                {tab === 'clients' && !viewClientId && <MyClients tid={s?.trainer_id} onView={(id) => { setViewClientId(id); setTab('client-detail'); }} />}
                {tab === 'client-detail' && viewClientId && <ClientDetail tid={s?.trainer_id} cid={viewClientId} goBack={() => { setViewClientId(null); setTab('clients'); }} />}
                {tab === 'feedback' && <FeedbackTab tid={s?.trainer_id} />}
                {tab === 'profile' && <ProfileTab tid={s?.trainer_id} />}
            </main>
        </div>
    )
}

function isExpired(d) { if (!d) return false; return new Date(d) < new Date(); }

function MyClients({ tid, onView }) {
    const [clients, setClients] = useState([])
    useEffect(() => { if (tid) Trainers.getClients(tid).then(setClients) }, [tid])

    return (<>
        <h2 className="section-title">My Clients</h2>
        {clients.length === 0 ? <p style={{ color: 'var(--muted)' }}>No clients assigned yet.</p> :
            <div className="card-grid">
                {clients.map(c => <div key={c.id} className="card clickable" onClick={() => onView(c.id)}>
                    <h4>{c.name}</h4>
                    <p>Age: {c.age || '-'} | Plan: {c.plan_type}</p>
                    <p>Goal: {c.goal || '-'} | Weight: {c.weight || '-'} kg</p>
                    <p>Membership Expiry: <strong style={{ color: isExpired(c.membership_expiry) ? 'var(--danger)' : 'var(--success)' }}>{c.membership_expiry || 'Not set'}</strong></p>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                </div>)}
            </div>}
    </>)
}

function ClientDetail({ tid, cid, goBack }) {
    const [client, setClient] = useState(null)
    const [wp, setWp] = useState({ day: 'Monday', exercise: '', sets: '', reps: '', notes: '' })
    const [dp, setDp] = useState({ meal_type: 'Breakfast', description: '', calories: '' })
    const [prog, setProg] = useState({ weight: '', waist: '', bodyfat: '', notes: '' })
    const [editWp, setEditWp] = useState(null)
    const [editDp, setEditDp] = useState(null)
    const [transferReason, setTransferReason] = useState('')
    const [showTransfer, setShowTransfer] = useState(false)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const meals = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Pre-Workout', 'Post-Workout']

    function reload() { Clients.get(cid).then(setClient) }
    useEffect(reload, [cid])

    // Workout CRUD
    async function addWorkout(e) {
        e.preventDefault()
        await Trainers.addWorkout(tid, cid, [{ ...wp, sets: parseInt(wp.sets) || 0, reps: parseInt(wp.reps) || 0 }])
        setWp({ day: 'Monday', exercise: '', sets: '', reps: '', notes: '' }); reload()
    }
    async function saveEditWp(e) {
        e.preventDefault()
        await Trainers.updateWorkout(editWp.id, { ...editWp, sets: parseInt(editWp.sets) || 0, reps: parseInt(editWp.reps) || 0 })
        setEditWp(null); reload()
    }
    async function delWorkout(id) { await Trainers.deleteWorkout(id); reload() }

    // Diet CRUD
    async function addDiet(e) {
        e.preventDefault()
        await Trainers.addDiet(tid, cid, [{ ...dp, calories: parseInt(dp.calories) || 0 }])
        setDp({ meal_type: 'Breakfast', description: '', calories: '' }); reload()
    }
    async function saveEditDp(e) {
        e.preventDefault()
        await Trainers.updateDiet(editDp.id, { ...editDp, calories: parseInt(editDp.calories) || 0 })
        setEditDp(null); reload()
    }
    async function delDiet(id) { await Trainers.deleteDiet(id); reload() }

    // Progress
    async function logProgress(e) {
        e.preventDefault()
        await Trainers.logProgress(tid, cid, { weight: parseFloat(prog.weight) || null, waist: parseFloat(prog.waist) || null, bodyfat: parseFloat(prog.bodyfat) || null, notes: prog.notes })
        setProg({ weight: '', waist: '', bodyfat: '', notes: '' }); reload()
    }

    // Feedback
    async function sendMsg() {
        const el = document.getElementById('t-msg')
        if (!el?.value) return
        await Trainers.sendFeedback(tid, cid, el.value)
        el.value = ''; reload()
    }

    // Transfer
    async function submitTransfer(e) {
        e.preventDefault()
        if (!transferReason.trim()) return
        await Trainers.transferClient(tid, cid, transferReason)
        setTransferReason(''); setShowTransfer(false)
        alert('Transfer request submitted to admin for approval!')
    }

    if (!client) return <p>Loading...</p>

    const inactive = client.status === 'inactive'

    return (<>
        <button className="btn-back" onClick={goBack}>← Back to Clients</button>
        <h2 className="section-title">{client.name}'s Profile</h2>

        {inactive && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <strong style={{ color: 'var(--danger)' }}>⚠️ INACTIVE — Membership Expired</strong>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>This client's membership has expired. You cannot make any changes until the admin reactivates their membership.</p>
        </div>}

        <div className="card-grid">
            <div className="card"><h4>Personal Info</h4><p>Age: {client.age} | Phone: {client.phone || '-'} | Email: {client.email || '-'}</p><p>Height: {client.height || '-'}cm | Weight: {client.weight || '-'}kg</p><p>Goal: {client.goal || '-'} | Body: {client.body_details || '-'}</p></div>
            <div className="card"><h4>Membership</h4><p>Plan: <strong>{client.plan_type}</strong> | Status: <span className={`badge badge-${client.status}`}>{client.status}</span></p>
                <p>Expiry: <span style={{ color: inactive ? 'var(--danger)' : 'inherit' }}>{client.membership_expiry || '-'}</span></p>
                {!inactive && <><button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={() => setShowTransfer(!showTransfer)}>🔄 Transfer Client</button>
                    {showTransfer && <form onSubmit={submitTransfer} style={{ marginTop: 8 }}>
                        <textarea placeholder="Reason for transfer..." value={transferReason} onChange={e => setTransferReason(e.target.value)} style={{ minHeight: 50 }} required />
                        <button type="submit" className="btn btn-gold btn-sm" style={{ marginTop: 4 }}>Submit Transfer Request</button>
                    </form>}</>}
            </div>
        </div>

        {/* Workout Plan - with inline edit */}
        <h3 className="section-title">🏋️ Workout Plan</h3>
        {!inactive && <form onSubmit={addWorkout} className="inline-form">
            <select value={wp.day} onChange={e => setWp(p => ({ ...p, day: e.target.value }))}>{days.map(d => <option key={d}>{d}</option>)}</select>
            <input placeholder="Exercise" value={wp.exercise} onChange={e => setWp(p => ({ ...p, exercise: e.target.value }))} required />
            <input type="number" placeholder="Sets" value={wp.sets} onChange={e => setWp(p => ({ ...p, sets: e.target.value }))} style={{ maxWidth: 70 }} />
            <input type="number" placeholder="Reps" value={wp.reps} onChange={e => setWp(p => ({ ...p, reps: e.target.value }))} style={{ maxWidth: 70 }} />
            <input placeholder="Notes" value={wp.notes} onChange={e => setWp(p => ({ ...p, notes: e.target.value }))} />
            <button type="submit" className="btn btn-gold btn-sm">Add</button>
        </form>}
        {client.workouts.length ? <table className="data-table"><thead><tr><th>Day</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Notes</th><th></th></tr></thead><tbody>
            {client.workouts.map(w => editWp && editWp.id === w.id ?
                <tr key={w.id}>
                    <td><select value={editWp.day} onChange={e => setEditWp(p => ({ ...p, day: e.target.value }))} style={{ margin: 0, padding: '4px' }}>{days.map(d => <option key={d}>{d}</option>)}</select></td>
                    <td><input value={editWp.exercise} onChange={e => setEditWp(p => ({ ...p, exercise: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><input type="number" value={editWp.sets} onChange={e => setEditWp(p => ({ ...p, sets: e.target.value }))} style={{ margin: 0, padding: '4px', width: 50 }} /></td>
                    <td><input type="number" value={editWp.reps} onChange={e => setEditWp(p => ({ ...p, reps: e.target.value }))} style={{ margin: 0, padding: '4px', width: 50 }} /></td>
                    <td><input value={editWp.notes || ''} onChange={e => setEditWp(p => ({ ...p, notes: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><button className="btn btn-gold btn-sm" onClick={saveEditWp}>Save</button> <button className="btn btn-outline btn-sm" onClick={() => setEditWp(null)}>✕</button></td>
                </tr>
                : <tr key={w.id}><td>{w.day}</td><td>{w.exercise}</td><td>{w.sets}</td><td>{w.reps}</td><td>{w.notes || ''}</td>
                    <td>{!inactive && <><button className="btn btn-outline btn-sm" onClick={() => setEditWp({ ...w })}>✏️</button> <button className="btn btn-danger btn-sm" onClick={() => delWorkout(w.id)}>✕</button></>}</td></tr>
            )}</tbody></table> : <p style={{ color: 'var(--muted)' }}>No workouts yet.</p>}

        {/* Diet Plan - with inline edit */}
        <h3 className="section-title">🥗 Diet Plan</h3>
        {!inactive && <form onSubmit={addDiet} className="inline-form">
            <select value={dp.meal_type} onChange={e => setDp(p => ({ ...p, meal_type: e.target.value }))}>{meals.map(m => <option key={m}>{m}</option>)}</select>
            <input placeholder="Description" value={dp.description} onChange={e => setDp(p => ({ ...p, description: e.target.value }))} required style={{ flex: 2 }} />
            <input type="number" placeholder="Calories" value={dp.calories} onChange={e => setDp(p => ({ ...p, calories: e.target.value }))} style={{ maxWidth: 100 }} />
            <button type="submit" className="btn btn-gold btn-sm">Add</button>
        </form>}
        {client.diets.length ? <table className="data-table"><thead><tr><th>Meal</th><th>Description</th><th>Cal</th><th></th></tr></thead><tbody>
            {client.diets.map(d => editDp && editDp.id === d.id ?
                <tr key={d.id}>
                    <td><select value={editDp.meal_type} onChange={e => setEditDp(p => ({ ...p, meal_type: e.target.value }))} style={{ margin: 0, padding: '4px' }}>{meals.map(m => <option key={m}>{m}</option>)}</select></td>
                    <td><input value={editDp.description} onChange={e => setEditDp(p => ({ ...p, description: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><input type="number" value={editDp.calories || ''} onChange={e => setEditDp(p => ({ ...p, calories: e.target.value }))} style={{ margin: 0, padding: '4px', width: 80 }} /></td>
                    <td><button className="btn btn-gold btn-sm" onClick={saveEditDp}>Save</button> <button className="btn btn-outline btn-sm" onClick={() => setEditDp(null)}>✕</button></td>
                </tr>
                : <tr key={d.id}><td>{d.meal_type}</td><td>{d.description}</td><td>{d.calories || '-'}</td>
                    <td>{!inactive && <><button className="btn btn-outline btn-sm" onClick={() => setEditDp({ ...d })}>✏️</button> <button className="btn btn-danger btn-sm" onClick={() => delDiet(d.id)}>✕</button></>}</td></tr>
            )}</tbody></table> : <p style={{ color: 'var(--muted)' }}>No diet plan yet.</p>}

        {/* Progress - Trainer logs */}
        <h3 className="section-title">📈 Client Progress</h3>
        {!inactive && <form onSubmit={logProgress} className="inline-form">
            <input type="number" step="0.1" placeholder="Weight (kg)" value={prog.weight} onChange={e => setProg(p => ({ ...p, weight: e.target.value }))} />
            <input type="number" step="0.1" placeholder="Waist (cm)" value={prog.waist} onChange={e => setProg(p => ({ ...p, waist: e.target.value }))} />
            <input type="number" step="0.1" placeholder="BF%" value={prog.bodyfat} onChange={e => setProg(p => ({ ...p, bodyfat: e.target.value }))} />
            <input placeholder="Notes" value={prog.notes} onChange={e => setProg(p => ({ ...p, notes: e.target.value }))} />
            <button type="submit" className="btn btn-gold btn-sm">Log Progress</button>
        </form>}
        {client.progress.length ? <table className="data-table"><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>BF%</th><th>Notes</th></tr></thead><tbody>
            {client.progress.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.weight || '-'}</td><td>{p.waist || '-'}</td><td>{p.bodyfat || '-'}</td><td>{p.notes || ''}</td></tr>)}</tbody></table>
            : <p style={{ color: 'var(--muted)' }}>No progress yet.</p>}

        {/* Feedback */}
        <h3 className="section-title">💬 Feedback</h3>
        {!inactive && <div className="inline-form"><input id="t-msg" placeholder="Send message to client" style={{ flex: 3 }} /><button className="btn btn-gold btn-sm" onClick={sendMsg}>Send</button></div>}
        <div className="msg-list" style={{ marginTop: 8 }}>
            {client.feedback.map((f, i) => <div key={i} className={`msg ${f.direction === 'client_to_trainer' ? 'msg-client' : 'msg-trainer'}`}>
                {f.message}<div className="msg-meta">{f.created_at} — {f.direction === 'client_to_trainer' ? 'Client' : 'You'}</div></div>)}
        </div>
    </>)
}

function FeedbackTab({ tid }) {
    const [data, setData] = useState([])
    useEffect(() => { if (tid) Trainers.getFeedback(tid).then(setData) }, [tid])
    return (<>
        <h2 className="section-title">All Feedback</h2>
        <div className="msg-list">
            {data.length === 0 ? <p style={{ color: 'var(--muted)' }}>No feedback yet.</p> :
                data.map((f, i) => <div key={i} className={`msg ${f.direction === 'client_to_trainer' ? 'msg-client' : 'msg-trainer'}`}>
                    <strong>{f.client_name}</strong>: {f.message}<div className="msg-meta">{f.created_at}</div></div>)}
        </div>
    </>)
}

function ProfileTab({ tid }) {
    const [profile, setProfile] = useState(null)
    useEffect(() => { if (tid) Trainers.get(tid).then(setProfile) }, [tid])

    async function save(e) {
        e.preventDefault()
        await Trainers.updateProfile(tid, profile)
        alert('Profile updated!')
    }

    if (!profile) return <p>Loading...</p>
    return (<>
        <h2 className="section-title">My Profile</h2>
        <form onSubmit={save} className="card" style={{ maxWidth: 500 }}>
            <div className="form-grid">
                <input placeholder="Name" value={profile.name || ''} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                <input type="number" placeholder="Age" value={profile.age || ''} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
                <input placeholder="Phone" value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                <input placeholder="Specialization" value={profile.specialization || ''} onChange={e => setProfile(p => ({ ...p, specialization: e.target.value }))} />
                <input type="number" placeholder="Experience" value={profile.experience || ''} onChange={e => setProfile(p => ({ ...p, experience: e.target.value }))} />
                <textarea className="full-w" placeholder="Certifications" value={profile.certifications || ''} onChange={e => setProfile(p => ({ ...p, certifications: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Save Changes</button>
        </form>
    </>)
}
