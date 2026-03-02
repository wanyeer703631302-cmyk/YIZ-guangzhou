// Simplest possible Vercel function - pure JavaScript
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  })
}
