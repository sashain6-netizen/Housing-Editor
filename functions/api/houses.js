export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // For now, return empty houses array since we don't have proper JWT verification
    // In a real implementation, you'd:
    // 1. Verify the JWT token to get user ID
    // 2. Query the database for user's houses
    // 3. Return the houses array
    
    return new Response(JSON.stringify({
      success: true,
      houses: [] // Empty array for now
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Fetch houses error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch houses: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
