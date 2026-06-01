export default function errorHandler(err, req, res, _next) {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
}
