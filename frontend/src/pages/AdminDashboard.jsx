import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Admin, Clients, Trainers, getSession, clearSession, getGreeting } from '../api'

export default function AdminDashboard() {
    const [tab, setTab] = useState('pending')
    const [viewClientId, setViewClientId] = useState(null)
    const [editTrainerId, setEditTrainerId] = useState(null)
    const s = getSession()
    const nav = useNavigate()

    function logout() { clearSession(); nav('/') }
    function viewClient(id) { setViewClientId(id); setEditTrainerId(null); setTab('view-client'); }
    function editTrainer(id) { setEditTrainerId(id); setViewClientId(null); setTab('edit-trainer'); }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="logo">ACE<span>est</span><small>Admin</small></div>
                <button className={`nav-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>📋 Pending Clients</button>
                <button className={`nav-btn ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>👥 All Clients</button>
                <button className={`nav-btn ${tab === 'trainers' ? 'active' : ''}`} onClick={() => setTab('trainers')}>🏋️ All Trainers</button>
                <button className={`nav-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>➕ Create Trainer</button>
                <button className={`nav-btn ${tab === 'changes' ? 'active' : ''}`} onClick={() => setTab('changes')}>🔄 Change Requests</button>
                <button className={`nav-btn ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>📝 Plan Requests</button>
                {viewClientId && <button className="nav-btn active" onClick={() => setTab('view-client')}>👤 Client Detail</button>}
                {editTrainerId && <button className="nav-btn active" onClick={() => setTab('edit-trainer')}>✏️ Edit Trainer</button>}
                <button className="nav-btn logout" onClick={logout}>🚪 Logout</button>
            </aside>
            <main className="main">
                <div className="greeting"><h1>{getGreeting()}, Admin</h1><p>Manage your gym ecosystem from here.</p></div>
                {tab === 'pending' && <PendingTab />}
                {tab === 'clients' && <ClientsTab onView={viewClient} />}
                {tab === 'trainers' && <TrainersTab onEdit={editTrainer} />}
                {tab === 'create' && <CreateTrainerTab />}
                {tab === 'changes' && <ChangesTab />}
                {tab === 'plans' && <PlansTab />}
                {tab === 'view-client' && viewClientId && <AdminViewClient cid={viewClientId} goBack={() => { setViewClientId(null); setTab('clients'); }} />}
                {tab === 'edit-trainer' && editTrainerId && <EditTrainerTab tid={editTrainerId} goBack={() => { setEditTrainerId(null); setTab('trainers'); }} />}
            </main>
        </div>
    )
}

/* ===== Pending Tab ===== */
function PendingTab() {
    const [data, setData] = useState([])
    const [trainers, setTrainers] = useState([])
    useEffect(() => { Admin.getPending().then(setData); Trainers.list().then(setTrainers); }, [])

    async function assign(cid) {
        const tid = document.getElementById('at-' + cid)?.value
        const exp = document.getElementById('ae-' + cid)?.value
        await Admin.assignTrainer({ client_id: cid, trainer_id: parseInt(tid), membership_expiry: exp })
        setData(d => d.filter(c => c.id !== cid))
    }

    return (<>
        <h2 className="section-title">Pending Client Registrations</h2>
        {data.length === 0 ? <p style={{ color: 'var(--muted)' }}>No pending registrations.</p> :
            <table className="data-table"><thead><tr><th>Name</th><th>Age</th><th>Goal</th><th>Plan</th><th>Phone</th><th>Assign Trainer</th></tr></thead><tbody>
                {data.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.age || '-'}</td><td>{c.goal || '-'}</td>
                    <td><span className="badge badge-pending">{c.plan_type}</span></td><td>{c.phone || '-'}</td>
                    <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select id={'at-' + c.id} style={{ width: 'auto', margin: 0, padding: '6px' }}>{trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                        <input id={'ae-' + c.id} placeholder="Expiry YYYY-MM-DD" style={{ width: 130, margin: 0, padding: '6px' }} />
                        <button className="btn btn-gold btn-sm" onClick={() => assign(c.id)}>Assign</button></td></tr>)}
            </tbody></table>}
    </>)
}

/* ===== All Clients (with status badge) ===== */
function ClientsTab({ onView }) {
    const [data, setData] = useState([])
    useEffect(() => { Clients.list().then(setData) }, [])
    return (<>
        <h2 className="section-title">All Clients</h2>
        <table className="data-table"><thead><tr><th>Name</th><th>Age</th><th>Plan</th><th>Trainer</th><th>Status</th><th>Expiry</th><th></th></tr></thead><tbody>
            {data.map(c => <tr key={c.id}>
                <td>{c.name}</td><td>{c.age || '-'}</td><td>{c.plan_type}</td><td>{c.trainer_name || 'Unassigned'}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                <td style={{ color: isExpired(c.membership_expiry) ? 'var(--danger)' : 'inherit' }}>{c.membership_expiry || '-'}</td>
                <td><button className="btn btn-outline btn-sm" onClick={() => onView(c.id)}>View / Edit</button></td></tr>)}
        </tbody></table>
    </>)
}
function isExpired(d) { if (!d) return false; return new Date(d) < new Date(); }

/* ===== All Trainers (with Edit button) ===== */
function TrainersTab({ onEdit }) {
    const [data, setData] = useState([])
    useEffect(() => { Trainers.list().then(setData) }, [])
    return (<>
        <h2 className="section-title">All Trainers</h2>
        <div className="card-grid">{data.map(t => <div key={t.id} className="card">
            <h4>{t.name}</h4><p>Age: {t.age || '-'} | Phone: {t.phone || '-'}</p><p>Experience: {t.experience} yrs</p><p>Certifications: {t.certifications || 'None listed'}</p>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => onEdit(t.id)}>✏️ Edit</button>
        </div>)}</div>
    </>)
}

/* ===== Create Trainer ===== */
function CreateTrainerTab() {
    const [f, setF] = useState({ username: '', password: '', name: '', age: '', phone: '', specialization: '', experience: '', certifications: '' })
    function set(k, v) { setF(p => ({ ...p, [k]: v })) }
    async function submit(e) {
        e.preventDefault()
        await Admin.createTrainer({ ...f, age: parseInt(f.age) || null, experience: parseInt(f.experience) || 0 })
        alert('Trainer created!')
        setF({ username: '', password: '', name: '', age: '', phone: '', specialization: '', experience: '', certifications: '' })
    }
    return (<>
        <h2 className="section-title">Create New Trainer</h2>
        <form onSubmit={submit} className="card" style={{ maxWidth: 500 }}>
            <div className="form-grid">
                <input placeholder="Username" value={f.username} onChange={e => set('username', e.target.value)} required />
                <input type="password" placeholder="Password" value={f.password} onChange={e => set('password', e.target.value)} required />
                <input placeholder="Full Name" value={f.name} onChange={e => set('name', e.target.value)} required />
                <input type="number" placeholder="Age" value={f.age} onChange={e => set('age', e.target.value)} />
                <input placeholder="Phone" value={f.phone} onChange={e => set('phone', e.target.value)} />
                <input placeholder="Specialization" value={f.specialization} onChange={e => set('specialization', e.target.value)} />
                <input type="number" placeholder="Experience (yrs)" value={f.experience} onChange={e => set('experience', e.target.value)} />
                <textarea className="full-w" placeholder="Certifications" value={f.certifications} onChange={e => set('certifications', e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Create Trainer</button>
        </form>
    </>)
}

/* ===== Change Requests ===== */
function ChangesTab() {
    const [data, setData] = useState([])
    const [trainers, setTrainers] = useState([])
    useEffect(() => { Admin.getChangeRequests().then(setData); Trainers.list().then(setTrainers); }, [])
    async function act(id, action) {
        const nt = document.getElementById('nt-' + id)?.value
        await Admin.approveChange(id, action, parseInt(nt) || null)
        setData(d => d.filter(r => r.id !== id))
    }
    return (<>
        <h2 className="section-title">Trainer Change Requests</h2>
        {data.length === 0 ? <p style={{ color: 'var(--muted)' }}>No pending requests.</p> :
            <table className="data-table"><thead><tr><th>Client</th><th>Current Trainer</th><th>Requested By</th><th>Reason</th><th>Action</th></tr></thead><tbody>
                {data.map(r => <tr key={r.id}><td>{r.client_name}</td><td>{r.current_trainer || 'None'}</td><td>{r.requested_by}</td><td>{r.reason}</td>
                    <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select id={'nt-' + r.id} style={{ width: 'auto', margin: 0, padding: '6px' }}>{trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                        <button className="btn btn-gold btn-sm" onClick={() => act(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => act(r.id, 'rejected')}>Reject</button></td></tr>)}
            </tbody></table>}
    </>)
}

/* ===== Plan Requests ===== */
function PlansTab() {
    const [data, setData] = useState([])
    useEffect(() => { Admin.getPlanRequests().then(setData) }, [])
    async function act(id, action) {
        await Admin.approvePlan(id, action)
        setData(d => d.filter(r => r.id !== id))
    }
    return (<>
        <h2 className="section-title">Plan Change Requests</h2>
        {data.length === 0 ? <p style={{ color: 'var(--muted)' }}>No pending plan change requests.</p> :
            <table className="data-table"><thead><tr><th>Client</th><th>Current Plan</th><th>Requested Plan</th><th>Action</th></tr></thead><tbody>
                {data.map(r => <tr key={r.id}><td>{r.client_name}</td><td>{r.old_plan}</td><td><strong style={{ color: 'var(--gold)' }}>{r.new_plan}</strong></td>
                    <td><button className="btn btn-gold btn-sm" onClick={() => act(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => act(r.id, 'rejected')}>Reject</button></td></tr>)}
            </tbody></table>}
    </>)
}

/* ===== Admin View Client — FULL EDIT + REACTIVATE ===== */
function AdminViewClient({ cid, goBack }) {
    const [client, setClient] = useState(null)
    const [wp, setWp] = useState({ day: 'Monday', exercise: '', sets: '', reps: '', notes: '' })
    const [dp, setDp] = useState({ meal_type: 'Breakfast', description: '', calories: '' })
    const [prog, setProg] = useState({ weight: '', waist: '', bodyfat: '', notes: '' })
    const [editWp, setEditWp] = useState(null)
    const [editDp, setEditDp] = useState(null)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [profileForm, setProfileForm] = useState(null)
    const [reactivateExpiry, setReactivateExpiry] = useState('')
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const meals = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Pre-Workout', 'Post-Workout']
    const plans = ['General', 'With Trainer', 'Advanced Trainer', 'Competition']

    function reload() {
        Clients.get(cid).then(c => {
            setClient(c); setProfileForm({
                name: c.name || '', age: c.age || '', phone: c.phone || '', email: c.email || '',
                height: c.height || '', weight: c.weight || '', goal: c.goal || '', body_details: c.body_details || '',
                plan_type: c.plan_type || 'General', membership_expiry: c.membership_expiry || '', status: c.status || 'pending'
            });
        })
    }
    useEffect(reload, [cid])

    // Workout
    async function addWorkout(e) { e.preventDefault(); await Admin.addWorkout(cid, [{ ...wp, sets: parseInt(wp.sets) || 0, reps: parseInt(wp.reps) || 0 }]); setWp({ day: 'Monday', exercise: '', sets: '', reps: '', notes: '' }); reload() }
    async function saveEditWp(e) { e.preventDefault(); await Trainers.updateWorkout(editWp.id, { ...editWp, sets: parseInt(editWp.sets) || 0, reps: parseInt(editWp.reps) || 0 }); setEditWp(null); reload() }
    async function delWorkout(id) { await Trainers.deleteWorkout(id); reload() }
    // Diet
    async function addDiet(e) { e.preventDefault(); await Admin.addDiet(cid, [{ ...dp, calories: parseInt(dp.calories) || 0 }]); setDp({ meal_type: 'Breakfast', description: '', calories: '' }); reload() }
    async function saveEditDp(e) { e.preventDefault(); await Trainers.updateDiet(editDp.id, { ...editDp, calories: parseInt(editDp.calories) || 0 }); setEditDp(null); reload() }
    async function delDiet(id) { await Trainers.deleteDiet(id); reload() }
    // Progress
    async function addProgress(e) { e.preventDefault(); await Admin.addProgress(cid, { weight: parseFloat(prog.weight) || null, waist: parseFloat(prog.waist) || null, bodyfat: parseFloat(prog.bodyfat) || null, notes: prog.notes }); setProg({ weight: '', waist: '', bodyfat: '', notes: '' }); reload() }
    // Profile
    async function saveProfile(e) { e.preventDefault(); await Admin.editClient(cid, { ...profileForm, age: parseInt(profileForm.age) || null, height: parseFloat(profileForm.height) || null, weight: parseFloat(profileForm.weight) || null }); setShowEditProfile(false); alert('Client profile updated!'); reload() }
    // Reactivate
    async function reactivate(e) { e.preventDefault(); if (!reactivateExpiry) return; await Admin.reactivate(cid, reactivateExpiry); setReactivateExpiry(''); alert('Client reactivated!'); reload() }

    if (!client) return <p>Loading...</p>

    const inactive = client.status === 'inactive'

    return (<>
        <button className="btn-back" onClick={goBack}>← Back to All Clients</button>
        <h2 className="section-title">{client.name}'s Full Profile</h2>

        {/* Status Banner */}
        {inactive && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <strong style={{ color: 'var(--danger)' }}>⚠️ INACTIVE — Membership Expired</strong>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>Trainers cannot make changes for this client until reactivated.</p>
            <form onSubmit={reactivate} className="inline-form" style={{ marginTop: 8 }}>
                <input type="date" value={reactivateExpiry} onChange={e => setReactivateExpiry(e.target.value)} required style={{ maxWidth: 180 }} />
                <button type="submit" className="btn btn-gold btn-sm">Reactivate with New Expiry</button>
            </form>
        </div>}

        <div className="card-grid">
            <div className="card"><h4>Personal</h4><p>Age: {client.age} | Phone: {client.phone || '-'} | Email: {client.email || '-'}</p><p>Height: {client.height || '-'}cm | Weight: {client.weight || '-'}kg</p><p>Goal: {client.goal || '-'}</p></div>
            <div className="card"><h4>Membership</h4><p>Plan: <strong>{client.plan_type}</strong></p>
                <p>Status: <span className={`badge badge-${client.status}`}>{client.status}</span></p>
                <p>Trainer: {client.trainer_name || 'Unassigned'}</p>
                <p>Expiry: <span style={{ color: inactive ? 'var(--danger)' : 'inherit' }}>{client.membership_expiry || '-'}</span></p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => setShowEditProfile(!showEditProfile)}>
                    {showEditProfile ? '✕ Close Editor' : '✏️ Edit Profile & Status'}
                </button>
            </div>
        </div>

        {/* Admin Profile Editor */}
        {showEditProfile && profileForm && <form onSubmit={saveProfile} className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Edit Client Details (Admin)</h4>
            <div className="form-grid">
                <input placeholder="Name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                <input type="number" placeholder="Age" value={profileForm.age} onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))} />
                <input placeholder="Phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                <input placeholder="Email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                <input type="number" step="0.1" placeholder="Height (cm)" value={profileForm.height} onChange={e => setProfileForm(p => ({ ...p, height: e.target.value }))} />
                <input type="number" step="0.1" placeholder="Weight (kg)" value={profileForm.weight} onChange={e => setProfileForm(p => ({ ...p, weight: e.target.value }))} />
                <input className="full-w" placeholder="Goal" value={profileForm.goal} onChange={e => setProfileForm(p => ({ ...p, goal: e.target.value }))} />
                <textarea className="full-w" placeholder="Body details" value={profileForm.body_details} onChange={e => setProfileForm(p => ({ ...p, body_details: e.target.value }))} />
                <select value={profileForm.plan_type} onChange={e => setProfileForm(p => ({ ...p, plan_type: e.target.value }))}>
                    {plans.map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={profileForm.status} onChange={e => setProfileForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
                <input type="date" placeholder="Expiry" value={profileForm.membership_expiry} onChange={e => setProfileForm(p => ({ ...p, membership_expiry: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Save All Changes</button>
        </form>}

        {/* Workout Plans */}
        <h3 className="section-title">🏋️ Workout Plan</h3>
        <form onSubmit={addWorkout} className="inline-form">
            <select value={wp.day} onChange={e => setWp(p => ({ ...p, day: e.target.value }))}>{days.map(d => <option key={d}>{d}</option>)}</select>
            <input placeholder="Exercise" value={wp.exercise} onChange={e => setWp(p => ({ ...p, exercise: e.target.value }))} required />
            <input type="number" placeholder="Sets" value={wp.sets} onChange={e => setWp(p => ({ ...p, sets: e.target.value }))} style={{ maxWidth: 70 }} />
            <input type="number" placeholder="Reps" value={wp.reps} onChange={e => setWp(p => ({ ...p, reps: e.target.value }))} style={{ maxWidth: 70 }} />
            <input placeholder="Notes" value={wp.notes} onChange={e => setWp(p => ({ ...p, notes: e.target.value }))} />
            <button type="submit" className="btn btn-gold btn-sm">Add</button>
        </form>
        {client.workouts.length ? <table className="data-table"><thead><tr><th>Day</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Notes</th><th></th></tr></thead><tbody>
            {client.workouts.map(w => editWp && editWp.id === w.id ?
                <tr key={w.id}><td><select value={editWp.day} onChange={e => setEditWp(p => ({ ...p, day: e.target.value }))}>{days.map(d => <option key={d}>{d}</option>)}</select></td>
                    <td><input value={editWp.exercise} onChange={e => setEditWp(p => ({ ...p, exercise: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><input type="number" value={editWp.sets} onChange={e => setEditWp(p => ({ ...p, sets: e.target.value }))} style={{ margin: 0, padding: '4px', width: 50 }} /></td>
                    <td><input type="number" value={editWp.reps} onChange={e => setEditWp(p => ({ ...p, reps: e.target.value }))} style={{ margin: 0, padding: '4px', width: 50 }} /></td>
                    <td><input value={editWp.notes || ''} onChange={e => setEditWp(p => ({ ...p, notes: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><button className="btn btn-gold btn-sm" onClick={saveEditWp}>Save</button> <button className="btn btn-outline btn-sm" onClick={() => setEditWp(null)}>Cancel</button></td></tr>
                : <tr key={w.id}><td>{w.day}</td><td>{w.exercise}</td><td>{w.sets}</td><td>{w.reps}</td><td>{w.notes || ''}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setEditWp({ ...w })}>✏️</button> <button className="btn btn-danger btn-sm" onClick={() => delWorkout(w.id)}>✕</button></td></tr>
            )}</tbody></table> : <p style={{ color: 'var(--muted)' }}>No workout plan yet.</p>}

        {/* Diet */}
        <h3 className="section-title">🥗 Diet Plan</h3>
        <form onSubmit={addDiet} className="inline-form">
            <select value={dp.meal_type} onChange={e => setDp(p => ({ ...p, meal_type: e.target.value }))}>{meals.map(m => <option key={m}>{m}</option>)}</select>
            <input placeholder="Description" value={dp.description} onChange={e => setDp(p => ({ ...p, description: e.target.value }))} required style={{ flex: 2 }} />
            <input type="number" placeholder="Calories" value={dp.calories} onChange={e => setDp(p => ({ ...p, calories: e.target.value }))} style={{ maxWidth: 100 }} />
            <button type="submit" className="btn btn-gold btn-sm">Add</button>
        </form>
        {client.diets.length ? <table className="data-table"><thead><tr><th>Meal</th><th>Description</th><th>Cal</th><th></th></tr></thead><tbody>
            {client.diets.map(d => editDp && editDp.id === d.id ?
                <tr key={d.id}><td><select value={editDp.meal_type} onChange={e => setEditDp(p => ({ ...p, meal_type: e.target.value }))}>{meals.map(m => <option key={m}>{m}</option>)}</select></td>
                    <td><input value={editDp.description} onChange={e => setEditDp(p => ({ ...p, description: e.target.value }))} style={{ margin: 0, padding: '4px', width: '100%' }} /></td>
                    <td><input type="number" value={editDp.calories || ''} onChange={e => setEditDp(p => ({ ...p, calories: e.target.value }))} style={{ margin: 0, padding: '4px', width: 80 }} /></td>
                    <td><button className="btn btn-gold btn-sm" onClick={saveEditDp}>Save</button> <button className="btn btn-outline btn-sm" onClick={() => setEditDp(null)}>Cancel</button></td></tr>
                : <tr key={d.id}><td>{d.meal_type}</td><td>{d.description}</td><td>{d.calories || '-'}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setEditDp({ ...d })}>✏️</button> <button className="btn btn-danger btn-sm" onClick={() => delDiet(d.id)}>✕</button></td></tr>
            )}</tbody></table> : <p style={{ color: 'var(--muted)' }}>No diet plan yet.</p>}

        {/* Progress */}
        <h3 className="section-title">📈 Progress</h3>
        <form onSubmit={addProgress} className="inline-form">
            <input type="number" step="0.1" placeholder="Weight" value={prog.weight} onChange={e => setProg(p => ({ ...p, weight: e.target.value }))} />
            <input type="number" step="0.1" placeholder="Waist" value={prog.waist} onChange={e => setProg(p => ({ ...p, waist: e.target.value }))} />
            <input type="number" step="0.1" placeholder="BF%" value={prog.bodyfat} onChange={e => setProg(p => ({ ...p, bodyfat: e.target.value }))} />
            <input placeholder="Notes" value={prog.notes} onChange={e => setProg(p => ({ ...p, notes: e.target.value }))} />
            <button type="submit" className="btn btn-gold btn-sm">Log</button>
        </form>
        {client.progress.length ? <table className="data-table"><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>BF%</th><th>Notes</th></tr></thead><tbody>
            {client.progress.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.weight || '-'}</td><td>{p.waist || '-'}</td><td>{p.bodyfat || '-'}</td><td>{p.notes || ''}</td></tr>)}</tbody></table>
            : <p style={{ color: 'var(--muted)' }}>No progress yet.</p>}

        {/* Feedback */}
        <h3 className="section-title">💬 Feedback</h3>
        <div className="msg-list">
            {client.feedback.length === 0 ? <p style={{ color: 'var(--muted)' }}>No feedback yet.</p> :
                client.feedback.map((f, i) => <div key={i} className={`msg ${f.direction === 'client_to_trainer' ? 'msg-client' : 'msg-trainer'}`}>
                    {f.message}<div className="msg-meta">{f.created_at} — {f.direction === 'client_to_trainer' ? 'Client' : 'Trainer'}</div></div>)}
        </div>
    </>)
}

/* ===== Edit Trainer (Admin) ===== */
function EditTrainerTab({ tid, goBack }) {
    const [form, setForm] = useState(null)
    useEffect(() => {
        Trainers.get(tid).then(t => setForm({
            name: t.name || '', age: t.age || '', phone: t.phone || '', specialization: t.specialization || '',
            experience: t.experience || '', certifications: t.certifications || ''
        }))
    }, [tid])

    async function save(e) {
        e.preventDefault()
        await Admin.editTrainer(tid, { ...form, age: parseInt(form.age) || null, experience: parseInt(form.experience) || 0 })
        alert('Trainer profile updated!'); goBack()
    }

    if (!form) return <p>Loading...</p>
    return (<>
        <button className="btn-back" onClick={goBack}>← Back to All Trainers</button>
        <h2 className="section-title">Edit Trainer Profile (Admin)</h2>
        <form onSubmit={save} className="card" style={{ maxWidth: 500 }}>
            <div className="form-grid">
                <input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <input type="number" placeholder="Age" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <input placeholder="Specialization" value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} />
                <input type="number" placeholder="Experience (yrs)" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} />
                <textarea className="full-w" placeholder="Certifications" value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Save Changes</button>
        </form>
    </>)
}
