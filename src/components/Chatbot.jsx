import { useState, useRef, useEffect } from 'react';
import {
  Box, Fab, Paper, TextField, IconButton, Typography, Avatar, List, ListItem,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { sendChatMessage } from '../api';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy tu asistente financiero. Probá:\n- "ingresá 1000 a bbva por sueldo"\n- "gastá 500 de caja fuerte en comida"\n- "pagué 300 de bbva por internet"\n- "compré 2000 en caja fuerte"\n- "cobré 50000 en astropay por diseño"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const data = await sendChatMessage(text);
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error al procesar el mensaje.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      <Fab color="primary" onClick={() => setOpen(!open)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
        {open ? <CloseIcon /> : <SmartToyIcon />}
      </Fab>

      {open && (
        <Paper elevation={8}
          sx={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 1200,
            width: 360, maxWidth: 'calc(100vw - 48px)',
            height: 480, maxHeight: 'calc(100vh - 160px)',
            display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden',
          }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Asistente Financiero</Typography>
          </Box>

          <List ref={listRef} sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
            {messages.map((msg, i) => (
              <ListItem key={i} sx={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                px: 0, py: 0.5,
              }}>
                {msg.role === 'bot' && (
                  <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main' }}>
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Paper elevation={1} sx={{
                  px: 1.5, py: 1, maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                  borderRadius: 2,
                  whiteSpace: 'pre-line',
                  fontSize: '0.875rem',
                }}>
                  {msg.text}
                </Paper>
              </ListItem>
            ))}
            {loading && (
              <ListItem sx={{ justifyContent: 'flex-start', px: 0, py: 0.5 }}>
                <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main' }}>
                  <SmartToyIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper elevation={1} sx={{ px: 1.5, py: 1, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Escribiendo...</Typography>
                </Paper>
              </ListItem>
            )}
          </List>

          <Box sx={{ display: 'flex', p: 1, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField size="small" fullWidth placeholder="Escribí un comando..."
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading} />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
}
