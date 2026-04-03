export async function onRequestGet(context) {
  const { request, env, params } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in to view houses.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please log in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const houseId = params.houseId;
    if (!houseId) {
      return new Response(JSON.stringify({ error: 'House ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if house exists and belongs to user
    const house = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, payload.userId).first();

    if (!house) {
      return new Response(JSON.stringify({ error: 'House not found or access denied.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      house
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Fetch house error:', error);
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return new Response(JSON.stringify({ error: 'Database error occurred while loading your house. Please try again in a few moments.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to load your house due to a server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in to update houses.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please log in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const houseId = params.houseId;
    if (!houseId) {
      return new Response(JSON.stringify({ error: 'House ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if house exists and belongs to user
    const existingHouse = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, payload.userId).first();

    if (!existingHouse) {
      return new Response(JSON.stringify({ error: 'House not found or access denied.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const text = await request.text();
    const body = JSON.parse(text);
    const { name, description, code, node_data } = body;

    // Validate updates
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'House name cannot be empty.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (name.trim().length > 100) {
        return new Response(JSON.stringify({ error: 'House name cannot be longer than 100 characters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    if (description !== undefined && description && description.trim().length > 500) {
      return new Response(JSON.stringify({ error: 'Description cannot be longer than 500 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Update house
    const now = new Date().toISOString();
    
    try {
      await env.DB.prepare(
        'UPDATE houses SET name = COALESCE(?, name), description = COALESCE(?, description), code = COALESCE(?, code), node_data = COALESCE(?, node_data), updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(
        name ? name.trim() : null,
        description !== undefined ? (description?.trim() || '') : null,
        code !== undefined ? code : null,
        node_data !== undefined ? node_data : null,
        now,
        houseId,
        payload.userId
      ).run();
    } catch (error) {
      // If column doesn't exist, try to add it and retry
      if (error.message.includes('no such column: node_data')) {
        console.log('Adding node_data column automatically');
        await env.DB.prepare('ALTER TABLE houses ADD COLUMN node_data TEXT DEFAULT \'\'').run();
        // Retry the update
        await env.DB.prepare(
          'UPDATE houses SET name = COALESCE(?, name), description = COALESCE(?, description), code = COALESCE(?, code), node_data = COALESCE(?, node_data), updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(
          name ? name.trim() : null,
          description !== undefined ? (description?.trim() || '') : null,
          code !== undefined ? code : null,
          node_data !== undefined ? node_data : null,
          now,
          houseId,
          payload.userId
        ).run();
      } else {
        throw error;
      }
    }

    // Fetch updated house
    const updatedHouse = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ?'
    ).bind(houseId).first();

    return new Response(JSON.stringify({
      success: true,
      house: updatedHouse
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Update house error:', error);
    
    if (error.message.includes('JSON')) {
      return new Response(JSON.stringify({ error: 'Invalid request format. Please ensure you\'re sending valid JSON data.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return new Response(JSON.stringify({ error: 'Database error occurred while updating your house. Please try again in a few moments.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to update your house due to a server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in to delete houses.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please log in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const houseId = params.houseId;
    if (!houseId) {
      return new Response(JSON.stringify({ error: 'House ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if house exists and belongs to user
    const existingHouse = await env.DB.prepare(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, payload.userId).first();

    if (!existingHouse) {
      return new Response(JSON.stringify({ error: 'House not found or access denied.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Delete house
    await env.DB.prepare('DELETE FROM houses WHERE id = ? AND user_id = ?').bind(houseId, payload.userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'House deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Delete house error:', error);
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return new Response(JSON.stringify({ error: 'Database error occurred while deleting your house. Please try again in a few moments.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to delete your house due to a server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await hmacSign(message, secret);

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
