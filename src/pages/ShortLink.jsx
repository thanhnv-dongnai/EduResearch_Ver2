import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { shortLinksAPI } from '../services/api';

// Phân giải link rút gọn /s/<code> -> /survey/<uuid thật của khảo sát>.
const ShortLink = () => {
  const { code } = useParams();
  const [surveyId, setSurveyId] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shortLinksAPI.resolve(code)
      .then((id) => { if (!cancelled) setSurveyId(id); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [code]);

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Link khảo sát không hợp lệ hoặc đã hết hạn</h2>
          <p style={{ color: 'var(--text-muted)' }}>Vui lòng liên hệ đơn vị khảo sát để lấy lại đường dẫn.</p>
        </div>
      </div>
    );
  }

  if (!surveyId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Đang tải...
      </div>
    );
  }

  return <Navigate to={`/survey/${surveyId}`} replace />;
};

export default ShortLink;
