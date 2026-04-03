const BASE = '/api';

async function api(path, options = {}) {
    const res = await fetch(BASE + path, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const Auth = {
    login: (username, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    register: (data) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    registerTrainer: (data) => api('/auth/register-trainer', { method: 'POST', body: JSON.stringify(data) }),
};

export const Clients = {
    list: () => api('/clients/'),
    get: (id) => api(`/clients/${id}`),
    updateProfile: (id, data) => api(`/clients/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    addFeedback: (id, message) => api(`/clients/${id}/feedback`, { method: 'POST', body: JSON.stringify({ message }) }),
    requestTrainerChange: (id, reason, requestedBy = 'client') => api(`/clients/${id}/trainer-change`, { method: 'POST', body: JSON.stringify({ reason, requested_by: requestedBy }) }),
    logProgress: (id, data) => api(`/clients/${id}/progress`, { method: 'POST', body: JSON.stringify(data) }),
    requestPlanChange: (id, newPlan) => api(`/clients/${id}/plan-change`, { method: 'POST', body: JSON.stringify({ new_plan: newPlan }) }),
};

export const Trainers = {
    list: () => api('/trainers/'),
    get: (id) => api(`/trainers/${id}`),
    updateProfile: (id, data) => api(`/trainers/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    getClients: (id) => api(`/trainers/${id}/clients`),
    addWorkout: (id, clientId, plans) => api(`/trainers/${id}/workout-plan`, { method: 'POST', body: JSON.stringify({ client_id: clientId, plans }) }),
    updateWorkout: (wpId, data) => api(`/trainers/workout-plan/${wpId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteWorkout: (wpId) => api(`/trainers/workout-plan/${wpId}`, { method: 'DELETE' }),
    addDiet: (id, clientId, plans) => api(`/trainers/${id}/diet-plan`, { method: 'POST', body: JSON.stringify({ client_id: clientId, plans }) }),
    updateDiet: (dpId, data) => api(`/trainers/diet-plan/${dpId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDiet: (dpId) => api(`/trainers/diet-plan/${dpId}`, { method: 'DELETE' }),
    getFeedback: (id) => api(`/trainers/${id}/feedback`),
    sendFeedback: (id, clientId, message) => api(`/trainers/${id}/feedback`, { method: 'POST', body: JSON.stringify({ client_id: clientId, message }) }),
    transferClient: (id, clientId, reason) => api(`/trainers/${id}/transfer-client`, { method: 'POST', body: JSON.stringify({ client_id: clientId, reason }) }),
    logProgress: (id, clientId, data) => api(`/trainers/${id}/log-progress`, { method: 'POST', body: JSON.stringify({ client_id: clientId, ...data }) }),
};

export const Admin = {
    createTrainer: (data) => api('/admin/create-trainer', { method: 'POST', body: JSON.stringify(data) }),
    getPending: () => api('/admin/pending-registrations'),
    assignTrainer: (data) => api('/admin/assign-trainer', { method: 'POST', body: JSON.stringify(data) }),
    getChangeRequests: () => api('/admin/change-requests'),
    approveChange: (id, action, newTrainerId) => api(`/admin/approve-change/${id}`, { method: 'POST', body: JSON.stringify({ action, new_trainer_id: newTrainerId }) }),
    getPlanRequests: () => api('/admin/plan-requests'),
    approvePlan: (id, action) => api(`/admin/approve-plan/${id}`, { method: 'POST', body: JSON.stringify({ action }) }),
    addWorkout: (clientId, plans) => api('/admin/add-workout', { method: 'POST', body: JSON.stringify({ client_id: clientId, plans }) }),
    addDiet: (clientId, plans) => api('/admin/add-diet', { method: 'POST', body: JSON.stringify({ client_id: clientId, plans }) }),
    addProgress: (clientId, data) => api('/admin/add-progress', { method: 'POST', body: JSON.stringify({ client_id: clientId, ...data }) }),
    editClient: (cid, data) => api(`/admin/edit-client/${cid}`, { method: 'PUT', body: JSON.stringify(data) }),
    editTrainer: (tid, data) => api(`/admin/edit-trainer/${tid}`, { method: 'PUT', body: JSON.stringify(data) }),
    reactivate: (cid, expiry) => api(`/admin/reactivate/${cid}`, { method: 'POST', body: JSON.stringify({ membership_expiry: expiry }) }),
};

export function getSession() {
    const s = localStorage.getItem('aceest_session');
    return s ? JSON.parse(s) : null;
}

export function setSession(data) {
    localStorage.setItem('aceest_session', JSON.stringify(data));
}

export function clearSession() {
    localStorage.removeItem('aceest_session');
}

export function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}
