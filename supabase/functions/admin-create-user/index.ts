import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: without these headers, the browser's preflight OPTIONS request to
// this function fails and `supabase.functions.invoke()` never reaches the
// handler at all (discovered via live browser testing — a Node-only test
// with the admin client never exercises CORS, since CORS is a browser-only
// enforcement mechanism).
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

  // Client gắn với JWT của người gọi, chỉ dùng để kiểm tra role của họ.
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
    return new Response(JSON.stringify({ error: 'Chỉ Quản trị viên mới được tạo tài khoản.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { name, email, password, role = 'viewer', unit = '' } = await req.json();
  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: 'Họ tên, email và mật khẩu là bắt buộc.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, unit }
  });
  if (createErr) {
    return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Trigger handle_new_user đã tự tạo 1 dòng profile role='viewer' —
  // cập nhật lại thành role được yêu cầu.
  await adminClient.from('profiles').update({ role }).eq('id', created.user.id);

  return new Response(
    JSON.stringify({ id: created.user.id, name, email, role, unit, created_at: created.user.created_at }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
