import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clients, Trainers, getSession, clearSession, getGreeting } from '../api'

const PLANS = [
    { name: 'General', price: '₹999/mo', features: ['Full gym facility access', 'Basic workout templates', 'Progress tracking dashboard', 'Community support'] },
    { name: 'With Trainer', price: '₹2,499/mo', features: ['Dedicated personal trainer', 'Custom weekly workout plans', 'Personalized diet plan', 'Weekly progress check-ins', 'Direct trainer messaging'] },
    { name: 'Advanced Trainer', price: '₹4,999/mo', features: ['Elite certified trainer', 'Advanced periodization', 'Detailed nutrition coaching', 'Body composition analysis', 'Monthly plan adjustments'] },
    { name: 'Competition', price: '₹9,999/mo', features: ['Competition prep specialist', 'Peak week programming', 'Posing & stage coaching', '24/7 trainer availability', 'Supplement guidance'] },
]

export default function ClientDashboard() {
    const [tab, setTab] = useState('overview')
    const [client, setClient] = useState(null)
    const s = getSession()
    const nav = useNavigate()

    function reload() { if (s?.client_id) Clients.get(s.client_id).then(setClient) }
    useEffect(reload, [])

    function logout() { clearSession(); nav('/') }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="logo">ACE<span>est</span><small>Client</small></div>
                <button className={`nav-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📊 Overview</button>
                <button className={`nav-btn ${tab === 'workouts' ? 'active' : ''}`} onClick={() => setTab('workouts')}>🏋️ Workouts</button>
                <button className={`nav-btn ${tab === 'diet' ? 'active' : ''}`} onClick={() => setTab('diet')}>🥗 Diet Plan</button>
                <button className={`nav-btn ${tab === 'progress' ? 'active' : ''}`} onClick={() => setTab('progress')}>📈 Progress</button>
                <button className={`nav-btn ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}>💬 Feedback</button>
                <button className={`nav-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>🔄 Requests</button>
                <button className={`nav-btn ${tab === 'trainer' ? 'active' : ''}`} onClick={() => setTab('trainer')}>🏋️ My Trainer</button>
                <button className={`nav-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>⚙️ Profile</button>
                <button className="nav-btn logout" onClick={logout}>🚪 Logout</button>
            </aside>
            <main className="main">
                <div className="greeting"><h1>{getGreeting()}, {s?.name || 'Member'}</h1><p>Stay on track with your fitness journey.</p></div>
                {!client ? <p>Loading your profile...</p> : <>
                    {tab === 'overview' && <Overview c={client} />}
                    {tab === 'workouts' && <Workouts c={client} />}
                    {tab === 'diet' && <Diet c={client} />}
                    {tab === 'progress' && <Progress c={client} reload={reload} />}
                    {tab === 'feedback' && <Feedback c={client} reload={reload} />}
                    {tab === 'requests' && <Requests c={client} reload={reload} />}
                    {tab === 'trainer' && <TrainerInfo c={client} />}
                    {tab === 'profile' && <Profile c={client} reload={reload} />}
                </>}
            </main>
        </div>
    )
}

function Overview({ c }) {
    return (<>
        <div className="card-grid">
            <div className="card"><h4>Personal Info</h4><p>Age: {c.age} | Height: {c.height || '-'}cm | Weight: {c.weight || '-'}kg</p><p>Goal: {c.goal || '-'}</p></div>
            <div className="card"><h4>Membership</h4><p>Plan: <strong style={{ color: 'var(--gold)' }}>{c.plan_type}</strong></p><p>Status: <span className={`badge badge-${c.status}`}>{c.status}</span></p><p>Expiry: {c.membership_expiry || 'Not set'}</p></div>
            <div className="card"><h4>Assigned Trainer</h4><p className="stat-big">{c.trainer_name || 'Awaiting Assignment'}</p></div>
            <div className="card"><h4>Quick Stats</h4>
                <p>Workouts: <strong>{c.workouts.length}</strong> exercises</p>
                <p>Diet: <strong>{c.diets.length}</strong> items</p>
                <p>Progress entries: <strong>{c.progress.length}</strong></p></div>
        </div>
    </>)
}

function Workouts({ c }) {
    const grouped = {}
    c.workouts.forEach(w => { if (!grouped[w.day]) grouped[w.day] = []; grouped[w.day].push(w); })
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return (<>
        <h2 className="section-title">Weekly Workout Plan</h2>
        {days.map(day => grouped[day] ? <div key={day} style={{ marginBottom: 24 }}>
            <h3 style={{ color: 'var(--gold)', marginBottom: 8 }}>{day}</h3>
            <table className="data-table"><thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Notes</th></tr></thead><tbody>
                {grouped[day].map(w => <tr key={w.id}><td>{w.exercise}</td><td>{w.sets}</td><td>{w.reps}</td><td>{w.notes || ''}</td></tr>)}
            </tbody></table>
        </div> : null)}
        {c.workouts.length === 0 && <p style={{ color: 'var(--muted)' }}>No workout plan assigned yet. Your trainer will create one for you.</p>}
    </>)
}

function Diet({ c }) {
    return (<>
        <h2 className="section-title">Diet & Nutrition Plan</h2>
        {c.diets.length ? <>
            <table className="data-table"><thead><tr><th>Meal</th><th>Description</th><th>Calories</th></tr></thead><tbody>
                {c.diets.map(d => <tr key={d.id}><td>{d.meal_type}</td><td>{d.description}</td><td>{d.calories || '-'}</td></tr>)}
            </tbody></table>
            <div className="card" style={{ marginTop: 16, maxWidth: 200 }}>
                <h4>Daily Total</h4><p className="stat-big">{c.diets.reduce((s, d) => s + (d.calories || 0), 0)} cal</p>
            </div>
        </> : <p style={{ color: 'var(--muted)' }}>No diet plan assigned yet.</p>}
    </>)
}

function Progress({ c, reload }) {
    const [w, setW] = useState('')
    const [wa, setWa] = useState('')
    const [bf, setBf] = useState('')

    async function log(e) {
        e.preventDefault()
        await Clients.logProgress(c.id, { weight: parseFloat(w) || null, waist: parseFloat(wa) || null, bodyfat: parseFloat(bf) || null })
        setW(''); setWa(''); setBf(''); reload()
    }

    return (<>
        <h2 className="section-title">Progress Tracking</h2>
        <form onSubmit={log} className="inline-form">
            <input type="number" step="0.1" placeholder="Weight (kg)" value={w} onChange={e => setW(e.target.value)} />
            <input type="number" step="0.1" placeholder="Waist (cm)" value={wa} onChange={e => setWa(e.target.value)} />
            <input type="number" step="0.1" placeholder="Body Fat %" value={bf} onChange={e => setBf(e.target.value)} />
            <button type="submit" className="btn btn-gold btn-sm">Log Progress</button>
        </form>
        {c.progress.length ? <table className="data-table"><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>BF%</th></tr></thead><tbody>
            {c.progress.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.weight || '-'}</td><td>{p.waist || '-'}</td><td>{p.bodyfat || '-'}</td></tr>)}
        </tbody></table> : <p style={{ color: 'var(--muted)' }}>No progress records yet. Start logging!</p>}
    </>)
}

function Feedback({ c, reload }) {
    const [msg, setMsg] = useState('')
    async function send(e) {
        e.preventDefault()
        if (!msg) return
        await Clients.addFeedback(c.id, msg)
        setMsg(''); reload()
    }
    return (<>
        <h2 className="section-title">Feedback & Suggestions</h2>
        <form onSubmit={send} className="inline-form"><input placeholder="Send a suggestion to your trainer..." value={msg} onChange={e => setMsg(e.target.value)} style={{ flex: 3 }} />
            <button type="submit" className="btn btn-gold btn-sm">Send</button></form>
        <div className="msg-list" style={{ marginTop: 16 }}>
            {c.feedback.length === 0 ? <p style={{ color: 'var(--muted)' }}>No messages yet.</p> :
                c.feedback.map((f, i) => <div key={i} className={`msg ${f.direction === 'client_to_trainer' ? 'msg-client' : 'msg-trainer'}`}>
                    {f.message}<div className="msg-meta">{f.created_at} — {f.direction === 'client_to_trainer' ? 'You' : 'Trainer'}</div></div>)}
        </div>
    </>)
}

function Requests({ c, reload }) {
    const [showChangeTr, setShowChangeTr] = useState(false)
    const [changeReason, setChangeReason] = useState('')
    const [showChangePlan, setShowChangePlan] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState('')

    async function submitTrainerChange(e) {
        e.preventDefault()
        if (!changeReason.trim()) return
        await Clients.requestTrainerChange(c.id, changeReason)
        setChangeReason(''); setShowChangeTr(false)
        alert('Trainer change request submitted!'); reload()
    }

    async function submitPlanChange(e) {
        e.preventDefault()
        if (!selectedPlan || selectedPlan === c.plan_type) return
        await Clients.requestPlanChange(c.id, selectedPlan)
        setSelectedPlan(''); setShowChangePlan(false)
        alert('Plan change request submitted for admin approval!'); reload()
    }

    return (<>
        <h2 className="section-title">My Requests</h2>
        <div className="card-grid">
            {/* Trainer Change Request */}
            <div className="card">
                <h4>🔄 Trainer Change Request</h4>
                <p style={{ marginBottom: 12 }}>Current trainer: <strong>{c.trainer_name || 'None'}</strong></p>
                <button className="btn btn-outline btn-sm" onClick={() => setShowChangeTr(!showChangeTr)}>
                    {showChangeTr ? 'Cancel' : 'Request Trainer Change'}
                </button>
                {showChangeTr && <form onSubmit={submitTrainerChange} style={{ marginTop: 12 }}>
                    <textarea placeholder="Why would you like to change your trainer? Please provide details..." value={changeReason} onChange={e => setChangeReason(e.target.value)} style={{ minHeight: 60 }} required />
                    <button type="submit" className="btn btn-gold btn-sm" style={{ marginTop: 4 }}>Submit Request</button>
                </form>}
                {c.change_requests.length > 0 && <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>Request History</p>
                    {c.change_requests.map((r, i) =>
                        <p key={i} style={{ fontSize: 12, marginBottom: 4 }}>"{r.reason}" — <span className={`badge badge-${r.status}`}>{r.status}</span> <span style={{ color: 'var(--muted)' }}>{r.created_at}</span></p>)}</div>}
            </div>

            {/* Plan Change Request */}
            <div className="card">
                <h4>📝 Subscription Plan Change</h4>
                <p style={{ marginBottom: 12 }}>Current plan: <strong style={{ color: 'var(--gold)' }}>{c.plan_type}</strong></p>
                <button className="btn btn-outline btn-sm" onClick={() => setShowChangePlan(!showChangePlan)}>
                    {showChangePlan ? 'Cancel' : 'Request Plan Change'}
                </button>
                {showChangePlan && <form onSubmit={submitPlanChange} style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Select your desired plan:</p>
                    {PLANS.map(plan => <label key={plan.name} style={{
                        display: 'block', padding: 12, marginBottom: 8, borderRadius: 8,
                        border: selectedPlan === plan.name ? '2px solid var(--gold)' : '1px solid var(--border)',
                        background: selectedPlan === plan.name ? 'rgba(212,175,55,0.08)' : 'transparent',
                        cursor: 'pointer', transition: '.2s'
                    }}>
                        <input type="radio" name="plan" value={plan.name} checked={selectedPlan === plan.name} onChange={e => setSelectedPlan(e.target.value)}
                            style={{ display: 'none' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <strong>{plan.name}</strong>
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{plan.price}</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {plan.features.map((f, i) => <li key={i} style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 0' }}>✓ {f}</li>)}
                        </ul>
                        {plan.name === c.plan_type && <span className="badge badge-active" style={{ marginTop: 4 }}>Current Plan</span>}
                    </label>)}
                    <button type="submit" className="btn btn-gold btn-sm" style={{ marginTop: 4 }} disabled={!selectedPlan || selectedPlan === c.plan_type}>Submit Plan Change Request</button>
                </form>}
                {c.plan_requests.length > 0 && <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>Request History</p>
                    {c.plan_requests.map((r, i) =>
                        <p key={i} style={{ fontSize: 12, marginBottom: 4 }}>{r.old_plan} → {r.new_plan} — <span className={`badge badge-${r.status}`}>{r.status}</span></p>)}</div>}
            </div>
        </div>
    </>)
}

function TrainerInfo({ c }) {
    const [trainer, setTrainer] = useState(null)
    useEffect(() => { if (c.trainer_id) Trainers.get(c.trainer_id).then(setTrainer) }, [c.trainer_id])

    if (!c.trainer_id) return <><h2 className="section-title">My Trainer</h2><p style={{ color: 'var(--muted)' }}>No trainer assigned yet. Admin will assign one soon.</p></>

    if (!trainer) return <p>Loading trainer info...</p>
    return (<>
        <h2 className="section-title">My Trainer</h2>
        <div className="card" style={{ maxWidth: 400 }}>
            <h4 style={{ fontSize: 18, marginBottom: 12 }}>{trainer.name}</h4>
            <p>Age: {trainer.age || '-'}</p>
            <p>Phone: {trainer.phone || '-'}</p>
            <p>Specialization: {trainer.specialization || 'General Fitness'}</p>
            <p>Experience: {trainer.experience || 0} years</p>
            <p>Certifications: {trainer.certifications || 'None listed'}</p>
        </div>
    </>)
}

function Profile({ c, reload }) {
    const [form, setForm] = useState({
        name: c.name || '', age: c.age || '', phone: c.phone || '', email: c.email || '',
        height: c.height || '', weight: c.weight || '', goal: c.goal || '', body_details: c.body_details || ''
    })
    function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function save(e) {
        e.preventDefault()
        await Clients.updateProfile(c.id, { ...form, age: parseInt(form.age) || null, height: parseFloat(form.height) || null, weight: parseFloat(form.weight) || null })
        alert('Profile updated! Changes reflected everywhere.'); reload()
    }

    return (<>
        <h2 className="section-title">Edit Profile</h2>
        <form onSubmit={save} className="card" style={{ maxWidth: 500 }}>
            <div className="form-grid">
                <input placeholder="Name" value={form.name} onChange={e => set('name', e.target.value)} />
                <input type="number" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)} />
                <input placeholder="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
                <input placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
                <input type="number" step="0.1" placeholder="Height (cm)" value={form.height} onChange={e => set('height', e.target.value)} />
                <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={e => set('weight', e.target.value)} />
                <input className="full-w" placeholder="Goal" value={form.goal} onChange={e => set('goal', e.target.value)} />
                <textarea className="full-w" placeholder="Body details" value={form.body_details} onChange={e => set('body_details', e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Save Changes</button>
        </form>
    </>)
}
