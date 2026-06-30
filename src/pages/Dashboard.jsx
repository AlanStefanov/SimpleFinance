import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip, List, ListItem,
  ListItemText, ListItemIcon, TextField,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningIcon from '@mui/icons-material/Warning';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { fetchDashboard } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [usdRate, setUsdRate] = useState(null);
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => { fetchDashboard({ month, year }).then(setData); }, [month, year]);

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares/oficial')
      .then(r => r.json())
      .then(r => setUsdRate(r.venta))
      .catch(() => setUsdRate(null));
  }, []);

  const formatMoney = (n, prefix = '$') => {
    const v = Number(n) || 0;
    const opts = v % 1 === 0 ? { minimumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return `${prefix}${v.toLocaleString('es-AR', opts)}`;
  };

  const totalEnDolares = (data && usdRate && usdRate > 0) ? (Number(data.ars_balance) / usdRate) + Number(data.usd_balance) : null;

  const statCards = [
    { label: 'Balance ARS', value: formatMoney(data?.ars_balance), icon: <AccountBalanceIcon />, color: '#1565c0', bg: '#e3edf7' },
    { label: 'Balance USD', value: formatMoney(data?.usd_balance, 'U$S '), icon: <AccountBalanceIcon />, color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'Total en Dólares', value: data ? (totalEnDolares != null ? formatMoney(totalEnDolares, 'U$S ') : 'Sin cotización') : null, icon: <AttachMoneyIcon />, color: '#f57c00', bg: '#fff3e0' },
    { label: 'Gastos del Mes', value: formatMoney(data?.monthly_expenses), icon: <ReceiptIcon />, color: '#c62828', bg: '#ffebee' },
    { label: 'Pagos Pendientes', value: formatMoney(data?.pending_payments), icon: <WarningIcon />, color: '#e65100', bg: '#fff3e0' },
    { label: 'Tarjetas a Pagar', value: formatMoney(data?.pending_summaries), icon: <CreditCardIcon />, color: '#6a1b9a', bg: '#f3e5f5' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Resumen Financiero</Typography>
        <TextField type="month" size="small" value={`${year}-${String(month).padStart(2, '0')}`}
          onChange={(e) => { const [y, m] = e.target.value.split('-'); setYear(parseInt(y)); setMonth(parseInt(m)); }}
          sx={{ width: 180 }}
        />
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2 }} columns={{ xs: 6, sm: 12, md: 12, lg: 12 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={6} md={4} lg={2} key={card.label}>
            <Card sx={{ bgcolor: card.bg, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                </Box>
                <Typography sx={{ fontWeight: 700, color: card.color, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.2rem' }, lineHeight: 1.2 }}>
                  {data ? card.value : <Skeleton width={80} />}
                </Typography>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Gastos Recientes</Typography>
                <Chip label="Ver todos" size="small" clickable onClick={() => navigate('/expenses')} />
              </Box>
              {data ? (
                <List dense>
                  {data.recent_payments?.map((p) => (
                    <ListItem key={p.id} divider sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            bgcolor: p.status === 'paid' ? '#34a853' : '#f9ab00',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <ArrowForwardIosIcon sx={{ fontSize: 14, color: '#fff' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={p.name}
                        secondary={p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-AR') : ''}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                          -${(Number(p.amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                        {p.account_name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {p.account_name}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                  {(!data.recent_payments || data.recent_payments.length === 0) && (
                    <Typography variant="body2" color="text.secondary">Sin pagos este mes</Typography>
                  )}
                </List>
              ) : <Skeleton variant="rectangular" height={200} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Próximos Pagos</Typography>
                <Chip label="Ver todos" size="small" clickable onClick={() => navigate('/payments')} />
              </Box>
              {data ? (
                <List dense>
                  {data.upcoming_payments?.map((p) => (
                    <ListItem key={p.id} divider sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            bgcolor: p.status === 'paid' ? '#34a853' : p.status === 'partial' ? '#f9ab00' : '#ea4335',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <ArrowForwardIosIcon sx={{ fontSize: 14, color: '#fff' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={p.name}
                        secondary={`Vence día ${p.due_day} · ${p.account_name || 'Sin cuenta'}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${Number(p.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Chip
                          label={p.status === 'paid' ? 'Pagado' : p.status === 'partial' ? 'Partial' : 'Pendiente'}
                          size="small"
                          color={p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning' : 'error'}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                  {(!data.upcoming_payments || data.upcoming_payments.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No hay pagos pendientes</Typography>
                  )}
                </List>
              ) : <Skeleton variant="rectangular" height={200} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
