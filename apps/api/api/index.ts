export default async function (req: any, res: any) {
  try {
    const { app, initApp } = await import('../src/index')
    await initApp()
    await app.ready()
    app.server.emit('request', req, res)
  } catch (err: any) {
    console.error('Vercel function error:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Failed to initialize app', details: err.message, stack: err.stack }))
  }
}
