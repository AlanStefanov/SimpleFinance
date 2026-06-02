import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, IconButton, Avatar, List, ListItem, ListItemText, Chip, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchTransactions, createTransaction, deleteTransaction } from '../api';

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo (ARS)', icon: <AccountBalanceWalletIcon /> },
  { value: 'checking', label: 'Cuenta Corriente (ARS)', icon: <AccountBalanceIcon /> },
  { value: 'savings', label: 'Caja de Ahorro (ARS)', icon: <SavingsIcon /> },
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: <CreditCardIcon /> },
  { value: 'usd_cash', label: 'Efectivo USD', icon: <AttachMoneyIcon /> },
  { value: 'usd_savings', label: 'Caja de Ahorro USD', icon: <AttachMoneyIcon /> },
];

const COLORS = ['#1a73e8', '#00bcd4', '#1a1a1a', '#34a853', '#ea4335', '#f9ab00', '#9334e6', '#e91e63', '#795548', '#ff6f00'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'cash', balance: '', color: '#1a73e8' });
  const [txDialog, setTxDialog] = useState({ open: false, account: null, type: 'income' });
  const [txForm, setTxForm] = useState({ amount: '', description: '' });
  const [transactions, setTransactions] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    const data = await fetchAccounts();
    setAccounts(data);
  };

  const loadTransactions = async (accountId) => {
    const data = await fetchTransactions(accountId);
    setTransactions(prev => ({ ...prev, [accountId]: data }));
  };

  const toggleExpand = (accountId) => {
    const next = !expanded[accountId];
    setExpanded(prev => ({ ...prev, [accountId]: next }));
    if (next && !transactions[accountId]) loadTransactions(accountId);
  };

  const receiveIncome = async () => {
    const result = await createTransaction(txDialog.account.id, { ...txForm, type: txDialog.type, amount: parseFloat(txForm.amount) });
    setAccounts(accounts.map(a => a.id === txDialog.account.id ? result.account : a));
    if (transactions[txDialog.account.id]) {
      setTransactions(prev => ({ ...prev, [txDialog.account.id]: [result.transaction, ...prev[txDialog.account.id]] }));
    }
    setTxDialog({ open: false, account: null, type: 'income' });
    setTxForm({ amount: '', description: '' });
  };

  const removeTx = async (accountId, txId) => {
    const result = await deleteTransaction(accountId, txId);
    setAccounts(accounts.map(a => a.id === accountId ? result.account : a));
    setTransactions(prev => ({ ...prev, [accountId]: (prev[accountId] || []).filter(t => t.id !== txId) }));
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({ name: item.name, type: item.type, balance: String(item.balance), color: item.color });
    } else {
      setEditItem(null);
      setForm({ name: '', type: 'cash', balance: '', color: '#1a73e8' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = { ...form, balance: parseFloat(form.balance) || 0 };
    if (editItem) {
      const updated = await updateAccount(editItem.id, data);
      setAccounts(accounts.map(a => a.id === editItem.id ? updated : a));
    } else {
      const created = await createAccount(data);
      setAccounts([...accounts, created]);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta cuenta?')) {
      await deleteAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const arsAccounts = accounts.filter(a => !a.type.startsWith('usd'));
  const usdAccounts = accounts.filter(a => a.type.startsWith('usd'));
  const totalArs = arsAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalUsd = usdAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const formatArs = (n) => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatUsd = (n) => `U$S ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatBalance = (a) => a.type.startsWith('usd') ? formatUsd(a.balance) : formatArs(a.balance);
  const formatTxAmount = (t, a) => a.type.startsWith('usd') ? formatUsd(t.amount) : formatArs(t.amount);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Mis Cuentas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Nueva Cuenta</Button>
      </Box>

      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: '#fff' }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Saldo Total Disponible</Typography>
          <Box sx={{ display: 'flex', gap: { xs: 3, md: 6 }, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' } }}>{formatArs(totalArs)}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Pesos ARS</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' } }}>{formatUsd(totalUsd)}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Dólares USD</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {accounts.map((account) => {
          const typeInfo = ACCOUNT_TYPES.find(t => t.value === account.type);
          const txList = transactions[account.id] || [];
          return (
            <Grid item xs={12} sm={6} md={4} key={account.id}>
              <Card sx={{ position: 'relative', '&:hover': { boxShadow: 4 } }}>
                <CardContent sx={{ pb: expanded[account.id] ? 1 : 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: account.color, width: 44, height: 44 }}>
                        {typeInfo?.icon || <AccountBalanceWalletIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{account.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeInfo?.label || account.type}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openDialog(account)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(account.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.4rem' }, color: Number(account.balance) < 0 ? 'error.main' : 'text.primary' }}>
                    {formatBalance(account)}
                  </Typography>

                  {/* Quick actions */}
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="success" startIcon={<ArrowUpwardIcon />}
                      onClick={() => { setTxDialog({ open: true, account, type: 'income' }); setTxForm({ amount: '', description: '' }); }}>
                      Ingreso
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<ArrowDownwardIcon />}
                      onClick={() => { setTxDialog({ open: true, account, type: 'expense' }); setTxForm({ amount: '', description: '' }); }}>
                      Gasto
                    </Button>
                    <IconButton size="small" onClick={() => toggleExpand(account.id)}>
                      {expanded[account.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </CardContent>

                <Collapse in={expanded[account.id]}>
                  <List dense sx={{ pt: 0, maxHeight: 240, overflow: 'auto' }}>
                    {txList.map(tx => (
                      <ListItem key={tx.id} divider secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => removeTx(account.id, tx.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      } sx={{ px: 2 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={tx.type === 'income' ? 'Ingreso' : 'Gasto'} size="small"
                                color={tx.type === 'income' ? 'success' : 'error'} sx={{ height: 20, fontSize: 11 }} />
                              <Typography variant="body2">{tx.description || tx.type}</Typography>
                            </Box>
                          }
                          secondary={new Date(tx.created_at).toLocaleString('es-AR')}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: tx.type === 'income' ? 'success.main' : 'error.main' }}>
                          {tx.type === 'income' ? '+' : '-'}{formatTxAmount(tx, account)}
                        </Typography>
                      </ListItem>
                    ))}
                    {txList.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>Sin movimientos</Typography>
                    )}
                  </List>
                </Collapse>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Account form dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre" fullWidth value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={form.type} label="Tipo" onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ACCOUNT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Saldo" type="number" fullWidth value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })} />
            <Box>
              <InputLabel sx={{ mb: 1 }}>Color</InputLabel>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COLORS.map(c => (
                  <Box key={c} onClick={() => setForm({ ...form, color: c })}
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid #000' : '3px solid transparent',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Income/Expense dialog */}
      <Dialog open={txDialog.open} onClose={() => setTxDialog({ ...txDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>
          {txDialog.type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'} — {txDialog.account?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Monto" type="number" fullWidth value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
            <TextField label="Descripción" fullWidth value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTxDialog({ ...txDialog, open: false })}>Cancelar</Button>
          <Button variant="contained" color={txDialog.type === 'income' ? 'success' : 'error'} onClick={receiveIncome}>
            {txDialog.type === 'income' ? 'Ingresar' : 'Gastar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
