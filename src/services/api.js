// src/services/api.js
import { supabase } from '../lib/supabaseClient';
import { runCompleteAcademicPipeline } from '../lib/statisticsEngine';

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, unit, academic_title')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

function toUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.email,
    role: profile?.role || 'viewer',
    unit: profile?.unit || ''
  };
}

export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email hoặc mật khẩu không đúng.');
    const profile = await fetchProfile(data.user.id);
    return { user: toUser(data.user, profile), token: data.session.access_token };
  },

  register: async ({ name, email, password, unit }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, unit } }
    });
    if (error) throw new Error(error.message || 'Không thể tạo tài khoản.');
    if (!data.session) {
      // Dự án Supabase yêu cầu xác nhận email.
      return;
    }
  },

  getMe: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error('Chưa đăng nhập.');
    const profile = await fetchProfile(authUser.id);
    return { user: toUser(authUser, profile) };
  },

  updateProfile: async ({ name, unit }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error('Chưa đăng nhập.');
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, unit })
      .eq('id', authUser.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { user: toUser(authUser, data) };
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;
    if (!email) throw new Error('Chưa đăng nhập.');
    // Xác minh lại mật khẩu cũ trước khi cho đổi (updateUser() của Supabase
    // không tự kiểm tra việc này).
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    if (verifyError) throw new Error('Mật khẩu hiện tại không chính xác.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { message: 'Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.' };
  }
};

async function currentProfileId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

async function getAnalysisImpl(id, filterOutliers = true) {
  const survey = await surveysAPI.getById(id);
  const { data: rawResponses, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', id)
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);

  if (!rawResponses || rawResponses.length === 0) {
    return {
      surveyInfo: {
        id: survey.id,
        title: survey.title,
        subtitle: survey.subtitle,
        audience: survey.audience,
        institution: survey.institution,
        target: survey.target,
        scale: survey.scale,
        variables: survey.variables
      },
      hasData: false,
      message: 'Khảo sát này chưa có phản hồi nào. Vui lòng thu thập phản hồi hoặc chạy scripts/seed-responses.mjs.'
    };
  }

  const analysisResults = runCompleteAcademicPipeline(survey, rawResponses, { filterOutliers });
  return { hasData: true, ...analysisResults };
}

export const surveysAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase.from('surveys').select('*').eq('id', id).single();
    if (error) throw new Error('Không tìm thấy khảo sát');
    return data;
  },

  create: async (formData) => {
    const created_by = await currentProfileId();
    const questions = formData.questions || [];
    const row = {
      title: formData.title,
      subtitle: formData.subtitle || '',
      institution: formData.institution || 'Cơ sở giáo dục đại học',
      audience: formData.audience || null,
      status: formData.status || 'Draft',
      scale: formData.scale || 'Likert 5',
      target: parseInt(formData.target) || 100,
      variables: Array.isArray(formData.variables)
        ? formData.variables
        : String(formData.variables || '').split(',').map((v) => v.trim()).filter(Boolean),
      questions,
      hypotheses: formData.hypotheses || [],
      questions_count: questions.length,
      created_by
    };
    const { data, error } = await supabase.from('surveys').insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id, formData) => {
    const patch = {};
    if (formData.title !== undefined) patch.title = formData.title;
    if (formData.subtitle !== undefined) patch.subtitle = formData.subtitle;
    if (formData.institution !== undefined) patch.institution = formData.institution;
    if (formData.audience !== undefined) patch.audience = formData.audience;
    if (formData.status !== undefined) patch.status = formData.status;
    if (formData.scale !== undefined) patch.scale = formData.scale;
    if (formData.target !== undefined) patch.target = parseInt(formData.target);
    if (formData.variables !== undefined) {
      patch.variables = Array.isArray(formData.variables)
        ? formData.variables
        : String(formData.variables).split(',').map((v) => v.trim()).filter(Boolean);
    }
    if (formData.questions !== undefined) {
      patch.questions = formData.questions;
      patch.questions_count = formData.questions.length;
    }
    if (formData.hypotheses !== undefined) patch.hypotheses = formData.hypotheses;

    const { data, error } = await supabase.from('surveys').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase.from('surveys').update({ status }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  clone: async (id) => {
    const original = await surveysAPI.getById(id);
    const created_by = await currentProfileId();
    const { id: _drop, created_at: _drop2, responses_count: _drop3, ...rest } = original;
    const { data, error } = await supabase
      .from('surveys')
      .insert({ ...rest, title: `${original.title} (Bản sao)`, responses_count: 0, created_by })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  getAnalysis: (id, filterOutliers = true) => getAnalysisImpl(id, filterOutliers),
  seedResponses: async () => {
    throw new Error('Sinh dữ liệu mẫu chỉ chạy qua "node scripts/seed-responses.mjs" ở máy phát triển (cần service role key).');
  },
  seedAll: async () => {
    throw new Error('Sinh dữ liệu mẫu chỉ chạy qua "node scripts/seed-responses.mjs" ở máy phát triển (cần service role key).');
  }
};

function formatDateVN(d = new Date()) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export const responsesAPI = {
  create: async (payload) => {
    const row = {
      survey_id: payload.survey_id,
      role: payload.role,
      unit: payload.unit,
      institution: payload.institution,
      gender: payload.gender,
      time_taken: payload.time_taken,
      status: payload.status || 'valid',
      answers: payload.answers || {},
      date: formatDateVN()
    };
    // Khong dung .select().single(): RLS chi cho phep SELECT voi vai tro
    // admin/researcher (Task 2), nen Postgres se tu choi ca INSERT khi
    // PostgREST yeu cau RETURNING (tuong duong kiem tra SELECT) cho khach an danh.
    // Insert "tran" (khong RETURNING) duoc WITH CHECK (true) cho phep binh thuong.
    const { error } = await supabase.from('responses').insert(row);
    if (error) throw new Error(error.message);
    return row;
  },

  getBySurvey: async (surveyId) => {
    let query = supabase.from('responses').select('*').order('id', { ascending: false });
    if (surveyId && surveyId !== 'all') {
      query = query.eq('survey_id', surveyId);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const total = rows.length;
    const valid = rows.filter((r) => r.status === 'valid').length;
    const invalid = total - valid;

    const groupCount = (key) => {
      const counts = rows.reduce((acc, r) => {
        acc[r[key]] = (acc[r[key]] || 0) + 1;
        return acc;
      }, {});
      return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
    };

    const textComments = [];
    rows.forEach((r) => {
      const answers = r.answers || {};
      Object.keys(answers).forEach((key) => {
        const val = answers[key];
        if (typeof val === 'string' && val.length > 5 && isNaN(Number(val))) {
          textComments.push({
            id: r.id,
            role: r.role,
            unit: r.unit,
            institution: r.institution,
            questionKey: key,
            content: val,
            date: r.date
          });
        }
      });
    });

    return {
      list: rows,
      stats: { total, valid, invalid },
      charts: {
        roleData: groupCount('role'),
        genderData: groupCount('gender'),
        institutionData: groupCount('institution')
      },
      textComments
    };
  },

  getAll: async (surveyId) => responsesAPI.getBySurvey(surveyId),

  delete: async (id) => {
    const { error } = await supabase.from('responses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  bulkStatus: async (ids, status) => {
    if (!['valid', 'invalid'].includes(status)) throw new Error('Trạng thái không hợp lệ (valid hoặc invalid).');
    const { error, count } = await supabase.from('responses').update({ status }).in('id', ids).select('id', { count: 'exact' });
    if (error) throw new Error(error.message);
    return { message: `Đã cập nhật trạng thái ${status} cho ${ids.length} phản hồi.`, updatedCount: count ?? ids.length };
  },

  bulkDelete: async (ids) => {
    const { error } = await supabase.from('responses').delete().in('id', ids);
    if (error) throw new Error(error.message);
    return { message: `Đã xóa thành công ${ids.length} phản hồi.`, deletedCount: ids.length };
  },

  import: async (surveyIdOrData, items) => {
    const survey_id = typeof surveyIdOrData === 'object' ? surveyIdOrData.survey_id : surveyIdOrData;
    const list = typeof surveyIdOrData === 'object' ? surveyIdOrData.items : items;
    const rows = list.map((item) => ({
      survey_id,
      role: item.role || 'Người tham gia',
      unit: item.unit || 'Khoa / Đơn vị',
      institution: item.institution || 'Cơ sở giáo dục đại học',
      gender: item.gender || 'Không nêu',
      time_taken: item.time_taken || '3 phút',
      status: item.status || 'valid',
      answers: typeof item.answers === 'object' ? item.answers : JSON.parse(item.answers || '{}'),
      date: item.date || formatDateVN()
    }));
    const { error } = await supabase.from('responses').insert(rows);
    if (error) throw new Error(error.message);
    return { message: `Đã nhập thành công ${rows.length} phản hồi vào khảo sát.`, count: rows.length };
  }
};
