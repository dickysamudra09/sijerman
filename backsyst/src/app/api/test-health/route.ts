export async function GET(request: Request) {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API routes are working'
  });
}

export async function POST(request: Request) {
  return Response.json({
    status: 'ok',
    method: 'POST',
    timestamp: new Date().toISOString()
  });
}
