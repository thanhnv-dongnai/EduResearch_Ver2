import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Save, Plus, CheckCircle, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { settingsAPI } from '../services/api';
import Toast from '../components/Toast';

const Settings = () => {
  const { currentUser } = useAuth();
  const { settings, academicYears, refreshSettings } = useSettings();

  const [formData, setFormData] = useState({ institution_name: '', principal_name: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [newYearLabel, setNewYearLabel] = useState('');
  const [savingYear, setSavingYear] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        institution_name: settings.institution_name || '',
        principal_name: settings.principal_name || '',
        location: settings.location || ''
      });
    }
  }, [settings]);

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsAPI.update(formData);
      await refreshSettings();
      showToast('Cập nhật cấu hình thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    if (!newYearLabel.trim()) return;
    try {
      setSavingYear(true);
      await settingsAPI.createAcademicYear(newYearLabel.trim());
      setNewYearLabel('');
      await refreshSettings();
      showToast('Đã thêm năm học mới!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi thêm năm học', 'error');
    } finally {
      setSavingYear(false);
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await settingsAPI.setCurrentAcademicYear(id);
      await refreshSettings();
      showToast('Đã đặt làm năm học hiện tại!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi đặt năm học hiện tại', 'error');
    }
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Cấu hình thông tin</h1>
        <p style={{ color: 'var(--text-muted)' }}>Thông tin trường/cơ sở đào tạo và năm học — dùng làm tiêu đề cho các báo cáo xuất và hiển thị trên Topbar</p>
      </div>

      <div className="card" style={{ maxWidth: '720px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} color="var(--primary)" />
          Thông tin Trường / Cơ sở đào tạo
        </h3>
        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Tên Trường / Cơ sở đào tạo</label>
              <input
                type="text" className="input"
                value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                placeholder="VD: Trường Đại học ABC"
              />
              <span className="form-hint">Hiển thị trên Topbar và tiêu đề các báo cáo xuất (.doc)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Hiệu trưởng</label>
              <input
                type="text" className="input"
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                placeholder="VD: PGS.TS. Nguyễn Văn A"
              />
              <span className="form-hint">Dùng trong phần chữ ký của các báo cáo xuất</span>
            </div>

            <div className="form-group">
              <label className="form-label">Tỉnh / Thành phố</label>
              <input
                type="text" className="input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="VD: Đồng Nai"
              />
              <span className="form-hint">Dùng cho dòng "...., ngày ..." ở chữ ký báo cáo xuất — để trống sẽ hiển thị chỗ chấm để điền tay</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={20} color="var(--primary)" />
          Năm học khảo sát
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Tất cả dữ liệu khảo sát đi theo năm học. Năm học hiện tại cũng có thể chọn nhanh trên Topbar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {academicYears.map((year) => (
            <div key={year.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: year.is_current ? 'var(--primary-tint)' : '#F9FAFB', borderRadius: 'var(--radius-md)', border: `1px solid ${year.is_current ? 'var(--primary-tint-border)' : 'var(--border-color)'}` }}>
              <span style={{ fontWeight: '600' }}>{year.label}</span>
              {year.is_current ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>
                  <CheckCircle size={14} /> Đang áp dụng
                </span>
              ) : (
                <button className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => handleSetCurrent(year.id)}>
                  Đặt làm năm hiện tại
                </button>
              )}
            </div>
          ))}
          {academicYears.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chưa có năm học nào.</div>
          )}
        </div>

        <form onSubmit={handleCreateYear} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text" className="input"
            value={newYearLabel}
            onChange={(e) => setNewYearLabel(e.target.value)}
            placeholder="VD: 2027 - 2028"
          />
          <button type="submit" className="btn btn-primary" disabled={savingYear} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <Plus size={16} />
            Thêm năm học
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
