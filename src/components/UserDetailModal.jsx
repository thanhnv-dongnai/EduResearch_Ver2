import React, { useState } from 'react';
import { X, User, KeyRound, Save, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI } from '../services/api';
import Toast from './Toast';

// Popup dùng chung cho 2 nơi: (1) "Người dùng" (admin xem/sửa người khác —
// sửa được tất cả, kể cả email/mật khẩu/vai trò) và (2) người dùng tự bấm
// vào thông tin tài khoản của chính mình trên Sidebar/Topbar (chỉ sửa được
// thông tin cơ bản, không sửa được email đăng nhập).
const UserDetailModal = ({ user, onClose, onSaved }) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const isSelf = user.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canEditAll = isAdmin && !isSelf;

  const [tab, setTab] = useState('info'); // 'info' | 'password'
  const [formData, setFormData] = useState({
    name: user.name || '',
    unit: user.unit || '',
    role: user.role || 'viewer',
    email: user.email || ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const roleLabel = (role) => role === 'admin'
    ? 'Quản trị viên'
    : (role === 'researcher' ? 'Nhà nghiên cứu' : 'Người xem');

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Họ và tên không được để trống', 'error');
      return;
    }
    try {
      setSavingInfo(true);
      let updatedUser;
      if (canEditAll) {
        updatedUser = await usersAPI.update(user.id, {
          name: formData.name.trim(),
          unit: formData.unit.trim(),
          role: formData.role,
          email: formData.email.trim() !== user.email ? formData.email.trim() : undefined,
          password: newPassword || undefined
        });
        setNewPassword('');
      } else {
        await authAPI.updateProfile({ name: formData.name.trim(), unit: formData.unit.trim() });
        updatedUser = { ...user, name: formData.name.trim(), unit: formData.unit.trim() };
        if (isSelf && updateCurrentUser) {
          updateCurrentUser({ name: formData.name.trim(), unit: formData.unit.trim() });
        }
      }
      showToast('Cập nhật thông tin thành công!');
      onSaved?.(updatedUser);
      setTimeout(onClose, 700);
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thông tin', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (!pwd.oldPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!pwd.newPassword || pwd.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      setSavingPwd(true);
      await authAPI.changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword });
      showToast('Đổi mật khẩu thành công!');
      setPwd({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Lỗi khi đổi mật khẩu', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Thông tin chi tiết người dùng</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setTab('info')}
            style={{
              padding: '0.75rem 0.25rem', border: 'none', background: 'none', fontSize: '0.9rem',
              fontWeight: tab === 'info' ? '700' : '500',
              color: tab === 'info' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'info' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <User size={16} /> Thông tin
          </button>
          {isSelf && (
            <button
              onClick={() => setTab('password')}
              style={{
                padding: '0.75rem 0.25rem', border: 'none', background: 'none', fontSize: '0.9rem',
                fontWeight: tab === 'password' ? '700' : '500',
                color: tab === 'password' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === 'password' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <KeyRound size={16} /> Đổi mật khẩu
            </button>
          )}
        </div>

        {tab === 'info' && (
          <form onSubmit={handleSaveInfo}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text" className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ Email {canEditAll ? '' : '(tài khoản đăng nhập)'}</label>
                <input
                  type="email" className="input"
                  value={formData.email}
                  disabled={!canEditAll}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={!canEditAll ? { backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' } : {}}
                />
                {!canEditAll && (
                  <span className="form-hint">Không thể tự đổi email tài khoản đăng nhập.</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Đơn vị / Khoa / Viện</label>
                <input
                  type="text" className="input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Khoa, Phòng ban, Viện nghiên cứu..."
                />
              </div>

              {canEditAll ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Vai trò (Role)</label>
                    <select
                      className="input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="researcher">Nhà nghiên cứu (Researcher)</option>
                      <option value="viewer">Người xem (Viewer)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đặt lại mật khẩu (bỏ trống nếu giữ nguyên)</label>
                    <input
                      type="password" className="input"
                      placeholder="Mật khẩu mới..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Vai trò</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                    <Shield size={16} /> {roleLabel(formData.role)}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={savingInfo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}

        {tab === 'password' && isSelf && (
          <form onSubmit={handleChangeOwnPassword}>
            <div className="modal-body">
              <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--primary-tint)', border: '1px solid var(--primary-tint-border)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--primary)', lineHeight: '1.5' }}>
                Mật khẩu mới phải có tối thiểu 6 ký tự.
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại *</label>
                <input
                  type="password" className="input"
                  value={pwd.oldPassword}
                  onChange={(e) => setPwd({ ...pwd, oldPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  type="password" className="input"
                  value={pwd.newPassword}
                  onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới *</label>
                <input
                  type="password" className="input"
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} />
                {savingPwd ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
