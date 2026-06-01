import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  fetchCards, createCard, updateCard, deleteCard,
  fetchCardExpenses, createCardExpense, deleteCardExpense,
  fetchCardSummaries, createCardSummary, updateSummaryStatus, deleteSummary,
  fetchCategories,
} from '../api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function Cards() {
  const [tab, setTab] = useState(0);
  const [cards, setCards] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [cardDialog, setCardDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [summaryPayDialog, setSummaryPayDialog] = useState(false);
  const [summaryTarget, setSummaryTarget] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [cardForm, setCardForm] = useState({ name: '', closing_day: 15, due_day: 5, credit_limit: '', color: '#9c27b0' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', installments: 1, category_id: '', expense_date: new Date().toISOString().slice(0, 10) });
  const [summaryForm, setSummaryForm] = useState({ card_id: '', closing_date: '', due_date: '', total_amount: '', minimum_payment: '' });
  const [payForm, setPayForm] = useState({ status: 'paid', paid_amount: '' });

  useEffect(() => {
    fetchCards().then(setCards);
    fetchCategories().then(setCategories);
    fetchCardSummaries().then(setSummaries);
  }, []);

  const loadExpenses = async (cardId) => {
    const data = await fetchCardExpenses(cardId);
    setCardExpenses(data);
  };

  const selectCard = (card) => {
    setSelectedCard(card);
    loadExpenses(card.id);
    setTab(1);
  };

  const openCardDialog = (card = null) => {
    setEditCard(card);
    setCardForm(card ? { name: card.name, closing_day: card.closing_day, due_day: card.due_day, credit_limit: String(card.credit_limit), color: card.color }
      : { name: '', closing_day: 15, due_day: 5, credit_limit: '', color: '#9c27b0' });
    setCardDialog(true);
  };

  const handleSaveCard = async () => {
    const data = { ...cardForm, credit_limit: parseFloat(cardForm.credit_limit) };
    if (editCard) {
      const updated = await updateCard(editCard.id, data);
      setCards(cards.map(c => c.id === editCard.id ? updated : c));
    } else {
      const created = await createCard(data);
      setCards([...cards, created]);
    }
    setCardDialog(false);
  };

  const handleDeleteCard = async (id) => {
    if (confirm('¿Eliminar esta tarjeta?')) {
      await deleteCard(id);
      setCards(cards.filter(c => c.id !== id));
      if (selectedCard?.id === id) { setSelectedCard(null); setTab(0); }
    }
  };

  const handleAddExpense = async () => {
    await createCardExpense(selectedCard.id, { ...expenseForm, amount: parseFloat(expenseForm.amount), category_id: expenseForm.category_id || null });
    setExpenseDialog(false);
    loadExpenses(selectedCard.id);
  };

  const handleDeleteExpense = async (id) => {
    if (confirm('¿Eliminar este consumo?')) {
      await deleteCardExpense(selectedCard.id, id);
      loadExpenses(selectedCard.id);
    }
  };

  const handleCreateSummary = async () => {
    const created = await createCardSummary({ ...summaryForm, total_amount: parseFloat(summaryForm.total_amount), minimum_payment: summaryForm.minimum_payment ? parseFloat(summaryForm.minimum_payment) : null });
    setSummaries([created, ...summaries]);
    setSummaryDialog(false);
  };

  const openPaySummary = (summary) => {
    setSummaryTarget(summary);
    setPayForm({ status: summary.status, paid_amount: String(summary.paid_amount || '') });
    setSummaryPayDialog(true);
  };

  const handlePaySummary = async () => {
    const updated = await updateSummaryStatus(summaryTarget.id, {
      status: payForm.status,
      paid_amount: payForm.status === 'paid' ? summaryTarget.total_amount : payForm.status === 'partial' ? parseFloat(payForm.paid_amount) : 0,
    });
    setSummaries(summaries.map(s => s.id === summaryTarget.id ? { ...s, ...updated } : s));
    setSummaryPayDialog(false);
  };

  const formatCurrency = (n) => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Tarjetas de Crédito</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setSummaryDialog(true)}>
            Nuevo Resumen
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCardDialog()}>
            Nueva Tarjeta
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Mis Tarjetas" />
        <Tab label="Consumos" disabled={!selectedCard} />
        <Tab label="Resúmenes" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {cards.map((card) => {
            const cardSummaries = summaries.filter(s => s.card_id === card.id);
            const pendingSummary = cardSummaries.find(s => s.status === 'pending');
            return (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <Card
                  sx={{
                    cursor: 'pointer', borderTop: `4px solid ${card.color}`,
                    '&:hover': { boxShadow: 4 },
                  }}
                  onClick={() => selectCard(card)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{card.name}</Typography>
                      <Box>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openCardDialog(card); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Cierre: {card.closing_day} | Vence: {card.due_day}
                    </Typography>
                    <Typography sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                      {formatCurrency(card.credit_limit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Límite de crédito</Typography>
                    {pendingSummary && (
                      <Chip label={`Pendiente: ${formatCurrency(pendingSummary.total_amount)}`} size="small" color="error" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {cards.length === 0 && (
            <Grid item xs={12}>
              <Card><CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No hay tarjetas registradas</Typography>
              </CardContent></Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        {selectedCard && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">{selectedCard.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Límite: {formatCurrency(selectedCard.credit_limit)}
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                setExpenseForm({ description: '', amount: '', installments: 1, category_id: '', expense_date: new Date().toISOString().slice(0, 10) });
                setExpenseDialog(true);
              }}>
                Agregar Consumo
              </Button>
            </Box>
            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Cuotas</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cardExpenses.map((e) => (
                      <TableRow key={e.id} hover>
                        <TableCell>{new Date(e.expense_date).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{e.description || '-'}</TableCell>
                        <TableCell>
                          {e.category_name && <Chip label={e.category_name} size="small" />}
                        </TableCell>
                        <TableCell>{e.installments}x</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(e.amount)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleDeleteExpense(e.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cardExpenses.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center">Sin consumos registrados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarjeta</TableCell>
                <TableCell>Cierre</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Mínimo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.card_name}</TableCell>
                  <TableCell>{new Date(s.closing_date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>{new Date(s.due_date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</TableCell>
                  <TableCell align="right">{s.minimum_payment ? formatCurrency(s.minimum_payment) : '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={s.status === 'paid' ? 'Pagado' : s.status === 'partial' ? 'Parcial' : 'Pendiente'}
                      size="small"
                      color={s.status === 'paid' ? 'success' : s.status === 'partial' ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />}
                      onClick={() => openPaySummary(s)}>
                      Pagar
                    </Button>
                    <IconButton size="small" onClick={async () => { if (confirm('¿Eliminar?')) { await deleteSummary(s.id); setSummaries(summaries.filter(x => x.id !== s.id)); }}}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {summaries.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">Sin resúmenes</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Dialog open={cardDialog} onClose={() => setCardDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre" fullWidth value={cardForm.name}
              onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} />
            <TextField label="Día de Cierre" type="number" fullWidth value={cardForm.closing_day}
              onChange={(e) => setCardForm({ ...cardForm, closing_day: parseInt(e.target.value) || 1 })} />
            <TextField label="Día de Vencimiento" type="number" fullWidth value={cardForm.due_day}
              onChange={(e) => setCardForm({ ...cardForm, due_day: parseInt(e.target.value) || 1 })} />
            <TextField label="Límite de Crédito" type="number" fullWidth value={cardForm.credit_limit}
              onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCardDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCard}>{editCard ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={expenseDialog} onClose={() => setExpenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Consumo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Descripción" fullWidth value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            <TextField label="Monto" type="number" fullWidth value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            <TextField label="Cuotas" type="number" fullWidth value={expenseForm.installments}
              onChange={(e) => setExpenseForm({ ...expenseForm, installments: parseInt(e.target.value) || 1 })} />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={expenseForm.category_id} label="Categoría"
                onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}>
                <MenuItem value=""><em>Sin categoría</em></MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Fecha" type="date" fullWidth value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddExpense}>Agregar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={summaryDialog} onClose={() => setSummaryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Resumen de Tarjeta</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tarjeta</InputLabel>
              <Select value={summaryForm.card_id} label="Tarjeta"
                onChange={(e) => setSummaryForm({ ...summaryForm, card_id: e.target.value })}>
                {cards.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Fecha de Cierre" type="date" fullWidth value={summaryForm.closing_date}
              onChange={(e) => setSummaryForm({ ...summaryForm, closing_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha de Vencimiento" type="date" fullWidth value={summaryForm.due_date}
              onChange={(e) => setSummaryForm({ ...summaryForm, due_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Monto Total" type="number" fullWidth value={summaryForm.total_amount}
              onChange={(e) => setSummaryForm({ ...summaryForm, total_amount: e.target.value })} />
            <TextField label="Pago Mínimo (opcional)" type="number" fullWidth value={summaryForm.minimum_payment}
              onChange={(e) => setSummaryForm({ ...summaryForm, minimum_payment: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateSummary}>Crear Resumen</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={summaryPayDialog} onClose={() => setSummaryPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pagar Resumen - {formatCurrency(summaryTarget?.total_amount)}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={payForm.status} label="Estado" onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                <MenuItem value="paid">Pagado Total</MenuItem>
                <MenuItem value="partial">Pago Parcial</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
              </Select>
            </FormControl>
            {payForm.status === 'partial' && (
              <TextField label="Monto Pagado" type="number" fullWidth value={payForm.paid_amount}
                onChange={(e) => setPayForm({ ...payForm, paid_amount: e.target.value })} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryPayDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handlePaySummary}>Actualizar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
