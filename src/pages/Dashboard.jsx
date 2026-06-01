import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip, List, ListItem,
  ListItemText, ListItemIcon,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningIcon from '@mui/icons-material/Warning';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { fetchDashboard } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard().then(setData); }, []);

  const formatArs = (n) => `$${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatUsd = (n) => `U$S ${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const statCards = [
    { label: 'Balance ARS', value: formatArs(data?.ars_balance), icon: <AccountBalanceIcon />, color: '#1a73e8', bg: '#e8f0fe' },
    { label: 'Balance USD', value: formatUsd(data?.usd_balance), icon: <AccountBalanceIcon />, color: '#34a853', bg: '#e6f4ea' },
    { label: 'Gastos del Mes', value: formatArs(data?.monthly_expenses), icon: <ReceiptIcon />, color: '#ea4335', bg: '#fce8e6' },
    { label: 'Pagos Pendientes', value: formatArs(data?.pending_payments), icon: <WarningIcon />, color: '#f9ab00', bg: '#fef7e0' },
    { label: 'Tarjetas a Pagar', value: formatArs(data?.pending_summaries), icon: <CreditCardIcon />, color: '#9334e6', bg: '#f3e8fd' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Resumen Financiero</Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <Card sx={{ bgcolor: card.bg, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
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
                  {data.recent_expenses?.map((e) => (
                    <ListItem key={e.id} divider sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          sx={{
                            width: 10, height: 10, borderRadius: '50%',
                            bgcolor: e.category_color || '#e0e0e0',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={e.description || e.category_name || 'Gasto'}
                        secondary={new Date(e.expense_date).toLocaleDateString('es-AR')}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: e.amount > 0 ? 'error.main' : 'inherit' }}>
                        -${Number(e.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </ListItem>
                  ))}
                  {(!data.recent_expenses || data.recent_expenses.length === 0) && (
                    <Typography variant="body2" color="text.secondary">Sin gastos este mes</Typography>
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
