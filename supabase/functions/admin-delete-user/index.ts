import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: see the matching comment in admin-create-user/index.ts.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerAuth?.user) {
    return new Response(JSON.stringify({ error: 'Chưa đăng nhập.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerAuth.user.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Chỉ Quản trị viên mới được xóa tài khoản.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { id } = await req.json();
  if (id === callerAuth.user.id) {
    return new Response(JSON.stringify({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(id);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ message: 'Xóa tài khoản thành công.' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
