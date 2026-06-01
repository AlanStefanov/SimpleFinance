import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchDashboard = () => api.get('/dashboard').then(r => r.data);

export const fetchAccounts = () => api.get('/accounts').then(r => r.data);
export const createAccount = (data) => api.post('/accounts', data).then(r => r.data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data).then(r => r.data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`).then(r => r.data);

export const fetchExpenses = (params) => api.get('/expenses', { params }).then(r => r.data);
export const createExpense = (data) => api.post('/expenses', data).then(r => r.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then(r => r.data);
export const fetchExpenseSummary = (params) => api.get('/expenses/summary', { params }).then(r => r.data);

export const fetchPayments = (params) => api.get('/payments', { params }).then(r => r.data);
export const fetchCurrentPayments = () => api.get('/payments/current').then(r => r.data);
export const createPayment = (data) => api.post('/payments', data).then(r => r.data);
export const updatePaymentStatus = (id, data) => api.patch(`/payments/${id}/status`, data).then(r => r.data);
export const deletePayment = (id) => api.delete(`/payments/${id}`).then(r => r.data);
export const generateMonth = (data) => api.post('/payments/generate', data).then(r => r.data);

export const fetchCards = () => api.get('/cards').then(r => r.data);
export const createCard = (data) => api.post('/cards', data).then(r => r.data);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data).then(r => r.data);
export const deleteCard = (id) => api.delete(`/cards/${id}`).then(r => r.data);

export const fetchCardExpenses = (id) => api.get(`/cards/${id}/expenses`).then(r => r.data);
export const createCardExpense = (id, data) => api.post(`/cards/${id}/expenses`, data).then(r => r.data);
export const deleteCardExpense = (cardId, expenseId) => api.delete(`/cards/${cardId}/expenses/${expenseId}`).then(r => r.data);

export const fetchCardSummaries = () => api.get('/cards/summaries').then(r => r.data);
export const createCardSummary = (data) => api.post('/cards/summaries', data).then(r => r.data);
export const updateSummaryStatus = (id, data) => api.patch(`/cards/summaries/${id}`, data).then(r => r.data);
export const deleteSummary = (id) => api.delete(`/cards/summaries/${id}`).then(r => r.data);

export const fetchCategories = () => api.get('/categories').then(r => r.data);

export default api;
