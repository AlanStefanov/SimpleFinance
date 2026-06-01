import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchAccounts, fetchCategories, fetchExpenseSummary } from '../api';

const EXPENSE_TYPES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'fixed', label: 'Fijo' },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAccountId, setPayAccountId] = useState('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState({
    account_id: '', category_id: '', amount: '', description: '',
    type: 'daily', expense_date: now.toISOString().slice(0, 10), is_paid: true, due_day: 1,
  });

  const load = useCallback(() => {
    const params = { month, year };
    if (filterType !== 'all') params.type = filterType;
    fetchExpenses(params).then(setExpenses);
    fetchExpenseSummary({ month, year }).then(setSummary);
  }, [filterType, month, year]);

  useEffect(() => {
    fetchAccounts().then(setAccounts);
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDialog = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({
        account_id: item.account_id || '',
        category_id: item.category_id || '',
        amount: String(item.amount),
        description: item.description || '',
        type: item.type,
        expense_date: item.expense_date ? item.expense_date.slice(0, 10) : '',
        is_paid: item.is_paid,
        due_day: item.due_day || 1,
      });
    } else {
      setEditItem(null);
      setForm({
        account_id: '', category_id: '', amount: '', description: '',
        type: 'daily', expense_date: new Date().toISOString().slice(0, 10),
        is_paid: true, due_day: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      amount: parseFloat(form.amount),
      account_id: form.type === 'fixed' ? null : (form.account_id || null),
      category_id: form.category_id || null,
      due_day: form.type === 'fixed' ? form.due_day : null,
      expense_date: form.type === 'fixed' ? '' : form.expense_date,
    };
    if (editItem) await updateExpense(editItem.id, data);
    else await createExpense(data);
    setDialogOpen(false);
    load();
  };

  const handleMarkPaid = (e) => {
    if (e.account_id) {
      doMarkPaid(e.id, e.account_id);
    } else {
      setPayTarget(e);
      setPayAccountId('');
      setPayDialogOpen(true);
    }
  };

  const doMarkPaid = async (id, accountId) => {
    const e = payTarget || expenses.find(x => x.id === id);
    await updateExpense(id, {
      account_id: accountId || e.account_id,
      category_id: e.category_id,
      amount: e.amount,
      description: e.description,
      type: e.type,
      expense_date: e.expense_date,
      due_day: e.due_day,
      is_paid: true,
    });
    setPayDialogOpen(false);
    load();
  };

  const handleMarkPaidConfirm = () => {
    doMarkPaid(payTarget.id, payAccountId);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este gasto?')) {
      await deleteExpense(id);
      load();
    }
  };

  const formatCurrency = (n) => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Gastos</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField type="month" size="small" value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => { const [y, m] = e.target.value.split('-'); setYear(parseInt(y)); setMonth(parseInt(m)); }}
            sx={{ width: 180 }}
          />
          <ToggleButtonGroup value={filterType} exclusive onChange={(_, v) => setFilterType(v || 'all')} size="small">
            <ToggleButton value="all">Todos</ToggleButton>
            {EXPENSE_TYPES.map(t => <ToggleButton key={t.value} value={t.value}>{t.label}</ToggleButton>)}
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Nuevo Gasto</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {EXPENSE_TYPES.map(t => {
          const s = summary.find(x => x.type === t.value);
          return (
            <Grid item xs={6} sm={3} key={t.value}>
              <Card>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="body2" color="text.secondary">{t.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(s?.total || 0)}</Typography>
                  <Typography variant="caption" color="text.secondary">{s?.count || 0} registros</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>
                    {e.type === 'fixed' && e.due_day
                      ? `Vence día ${e.due_day}`
                      : new Date(e.expense_date).toLocaleDateString('es-AR')
                    }
                  </TableCell>
                  <TableCell>{e.description || '-'}</TableCell>
                  <TableCell>
                    {e.category_name && <Chip label={e.category_name} size="small" sx={{ bgcolor: e.category_color, color: '#fff' }} />}
                  </TableCell>
                  <TableCell>
                    <Chip label={EXPENSE_TYPES.find(t => t.value === e.type)?.label || e.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                    -{formatCurrency(e.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={e.is_paid ? 'Pagado' : 'Pendiente'} size="small" color={e.is_paid ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {!e.is_paid && (
                      <IconButton size="small" color="success" onClick={() => handleMarkPaid(e)} title="Marcar como pagado">
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => openDialog(e)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(e.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">Sin gastos registrados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Descripción" fullWidth value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="Monto" type="number" fullWidth value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={form.type} label="Tipo" onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EXPENSE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={form.category_id} label="Categoría" onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <MenuItem value=""><em>Sin categoría</em></MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            {form.type === 'fixed' ? (
              <FormControl fullWidth>
                <InputLabel>Día de pago</InputLabel>
                <Select value={form.due_day} label="Día de pago" onChange={(e) => setForm({ ...form, due_day: e.target.value })}>
                  {[1, 2, 3, 4, 5].map(d => <MenuItem key={d} value={d}>Día {d}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Cuenta</InputLabel>
                  <Select value={form.account_id} label="Cuenta" onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                    <MenuItem value=""><em>Sin cuenta</em></MenuItem>
                    {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Fecha" type="date" fullWidth value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pagar "{payTarget?.description || payTarget?.name}"</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2">Monto: {formatCurrency(payTarget?.amount)}</Typography>
            <FormControl fullWidth>
              <InputLabel>Desde qué cuenta?</InputLabel>
              <Select value={payAccountId} label="Desde qué cuenta?" onChange={(e) => setPayAccountId(e.target.value)}>
                <MenuItem value=""><em>Sin cuenta</em></MenuItem>
                {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleMarkPaidConfirm}>Pagar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
