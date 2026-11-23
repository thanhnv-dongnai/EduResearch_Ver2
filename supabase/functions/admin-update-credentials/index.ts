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
    return new Response(JSON.stringify({ error: 'Chỉ Quản trị viên mới được đổi email/mật khẩu người dùng khác.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { id, email, password } = await req.json();
  if (!id || (!email && !password)) {
    return new Response(JSON.stringify({ error: 'Cần id và ít nhất email hoặc mật khẩu mới.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const updatePayload = {};
  if (email) updatePayload.email = email;
  if (password) updatePayload.password = password;

  const { data: updated, error: updateErr } = await adminClient.auth.admin.updateUserById(id, updatePayload);
  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (email) {
    await adminClient.from('profiles').update({ email }).eq('id', id);
  }

  return new Response(
    JSON.stringify({ id, email: updated.user.email }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
