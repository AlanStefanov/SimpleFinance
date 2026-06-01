import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, LinearProgress, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  fetchPayments, createPayment, updatePaymentStatus, deletePayment,
  generateMonth, fetchAccounts, fetchCards,
} from '../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ status: 'paid', partial_amount: '', account_id: '', payment_type: 'account', card_id: '' });
  const [form, setForm] = useState({ name: '', amount: '', due_day: 1, month_year: '', account_id: '' });

  const load = useCallback(() => {
    fetchPayments({ month, year }).then(setPayments);
  }, [month, year]);

  useEffect(() => { fetchAccounts().then(setAccounts); fetchCards().then(setCards); }, []);
  useEffect(() => { load(); }, [load]);

  const monthYear = `${year}-${String(month).padStart(2, '0')}`;

  const openNewDialog = () => {
    setForm({ name: '', amount: '', due_day: 1, month_year: monthYear, account_id: '' });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    await createPayment({ ...form, amount: parseFloat(form.amount), account_id: form.account_id || null });
    setDialogOpen(false);
    load();
  };

  const openPayDialog = (payment) => {
    setPayTarget(payment);
    setPayForm({
      status: payment.status,
      partial_amount: String(payment.partial_amount || ''),
      account_id: payment.account_id || '',
      payment_type: payment.card_id ? 'card' : 'account',
      card_id: payment.card_id || '',
    });
    setPayDialogOpen(true);
  };

  const handlePayUpdate = async () => {
    await updatePaymentStatus(payTarget.id, {
      status: payForm.status,
      partial_amount: payForm.status === 'partial' ? parseFloat(payForm.partial_amount) : payForm.status === 'paid' ? payTarget.amount : 0,
      account_id: payForm.payment_type === 'account' ? (payForm.account_id || null) : null,
      card_id: payForm.payment_type === 'card' ? (payForm.card_id || null) : null,
    });
    setPayDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este pago?')) await deletePayment(id);
    load();
  };

  const handleGenerateMonth = async () => {
    if (!confirm(`¿Generar pagos para ${monthYear}? (copiará del mes anterior)`)) return;
    try {
      await generateMonth({ month, year });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al generar');
    }
  };

  const dayNames = { 1: 'Día 1', 2: 'Día 2', 3: 'Día 3', 4: 'Día 4', 5: 'Día 5' };
  const days = [1, 2, 3, 4, 5];

  const formatCurrency = (n) => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Pagos 1 al 5</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField type="month" size="small" value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => { const [y, m] = e.target.value.split('-'); setYear(parseInt(y)); setMonth(parseInt(m)); }}
            sx={{ width: 180 }}
          />
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleGenerateMonth}>
            Generar Mes
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewDialog}>
            Agregar Pago
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#e8f0fe' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary">Total Pendiente</Typography>
              <Typography sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{formatCurrency(totalPending)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#e6f4ea' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary">Total Pagado</Typography>
              <Typography sx={{ fontWeight: 700, color: 'success.main', fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{formatCurrency(totalPaid)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {days.map((day) => {
        const dayPayments = payments.filter(p => p.due_day === day);
        if (dayPayments.length === 0) return null;

        const dayTotal = dayPayments.reduce((s, p) => s + Number(p.amount), 0);
        const dayPaid = dayPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
        const progress = dayTotal > 0 ? (dayPaid / dayTotal) * 100 : 0;

        return (
          <Card key={day} sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">{dayNames[day]}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(dayPaid)} / {formatCurrency(dayTotal)}
                  </Typography>
                  <Chip
                    label={progress >= 100 ? 'Completo' : `${Math.round(progress)}%`}
                    size="small"
                    color={progress >= 100 ? 'success' : progress > 0 ? 'warning' : 'default'}
                  />
                </Box>
              </Box>

              <LinearProgress variant="determinate" value={Math.min(progress, 100)} sx={{ mb: 2, height: 6, borderRadius: 3 }} />

              <Grid container spacing={1.5}>
                {dayPayments.map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p.id}>
                    <Card variant="outlined" sx={{
                      bgcolor: p.status === 'paid' ? '#e6f4ea' : p.status === 'partial' ? '#fef7e0' : '#fff',
                      borderColor: p.status === 'paid' ? '#34a853' : p.status === 'partial' ? '#f9ab00' : 'divider',
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                            <Typography sx={{ fontWeight: 700, mt: 0.5, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                              {formatCurrency(p.amount)}
                            </Typography>
                          </Box>
                          <Chip
                            label={p.status === 'paid' ? 'Pagado' : p.status === 'partial' ? 'Partial' : 'Pendiente'}
                            size="small"
                            color={p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning' : 'error'}
                          />
                        </Box>
                        {p.status === 'paid' && p.paid_at && (
                          <Typography variant="caption" color="text.secondary">
                            Pagado: {new Date(p.paid_at).toLocaleDateString('es-AR')}
                          </Typography>
                        )}
                        {p.status === 'partial' && (
                          <Typography variant="caption" color="text.secondary">
                            Pagado: {formatCurrency(p.partial_amount)}
                          </Typography>
                        )}
                        {p.account_name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {p.account_name}
                          </Typography>
                        )}
                        {p.card_name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {p.card_name}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          <Button
                            size="small"
                            variant={p.status === 'paid' ? 'contained' : 'outlined'}
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => openPayDialog(p)}
                            sx={{ flex: 1, minWidth: 0 }}
                          >
                            {p.status === 'paid' ? 'Pagado' : 'Pagar'}
                          </Button>
                          {p.status !== 'paid' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<PaymentIcon />}
                              onClick={() => openPayDialog(p)}
                              sx={{ minWidth: 0 }}
                            >
                              Parcial
                            </Button>
                          )}
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        );
      })}

      {payments.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">No hay pagos para este mes</Typography>
            <Typography variant="body2" color="text.secondary">Agrega pagos manualmente o genera desde el mes anterior</Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openNewDialog}>Agregar Pago</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre" fullWidth value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Monto" type="number" fullWidth value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Día de Vencimiento</InputLabel>
              <Select value={form.due_day} label="Día de Vencimiento" onChange={(e) => setForm({ ...form, due_day: e.target.value })}>
                {[1, 2, 3, 4, 5].map(d => <MenuItem key={d} value={d}>Día {d}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Cuenta</InputLabel>
              <Select value={form.account_id} label="Cuenta" onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                <MenuItem value=""><em>Sin cuenta</em></MenuItem>
                {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Crear</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{payTarget?.name} - {formatCurrency(payTarget?.amount)}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={payForm.status} label="Estado" onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                <MenuItem value="paid">Pagado</MenuItem>
                <MenuItem value="partial">Pago Parcial</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
              </Select>
            </FormControl>
            {payForm.status === 'partial' && (
              <TextField label="Monto Pagado" type="number" fullWidth value={payForm.partial_amount}
                onChange={(e) => setPayForm({ ...payForm, partial_amount: e.target.value })} />
            )}
            <ToggleButtonGroup
              value={payForm.payment_type}
              exclusive
              onChange={(e, v) => v && setPayForm({ ...payForm, payment_type: v, account_id: '', card_id: '' })}
              fullWidth
              size="small"
            >
              <ToggleButton value="account">Cuenta</ToggleButton>
              <ToggleButton value="card">Tarjeta</ToggleButton>
            </ToggleButtonGroup>
            {payForm.payment_type === 'account' && (
              <FormControl fullWidth>
                <InputLabel>Cuenta</InputLabel>
                <Select value={payForm.account_id} label="Cuenta" onChange={(e) => setPayForm({ ...payForm, account_id: e.target.value })}>
                  <MenuItem value=""><em>Sin cuenta</em></MenuItem>
                  {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {payForm.payment_type === 'card' && (
              <FormControl fullWidth>
                <InputLabel>Tarjeta</InputLabel>
                <Select value={payForm.card_id} label="Tarjeta" onChange={(e) => setPayForm({ ...payForm, card_id: e.target.value })}>
                  <MenuItem value=""><em>Sin tarjeta</em></MenuItem>
                  {cards.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handlePayUpdate}>Actualizar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
