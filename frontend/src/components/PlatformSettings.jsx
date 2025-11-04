import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader, Check, X } from 'lucide-react';

const PlatformSettings = ({ apiUrl, apiKey }) => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('auth_token');
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    if (body && !(body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    } else if (body) {
      options.body = body;
    }

    const response = await fetch(`${apiUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/settings');
      setSettings(data.settings);
    } catch (error) {
      showNotification('Failed to load settings: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiCall('/api/admin/settings/upload/logo', 'POST', formData);
      showNotification('Logo uploaded successfully!');
      loadSettings();
    } catch (error) {
      showNotification('Failed to upload logo: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiCall('/api/admin/settings/upload/favicon', 'POST', formData);
      showNotification('Favicon uploaded successfully!');
      loadSettings();
      // Reload page to show new favicon
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showNotification('Failed to upload favicon: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSettingUpdate = async (key, value) => {
    try {
      await apiCall(`/api/admin/settings/${key}`, 'PUT', { value });
      showNotification('Setting updated successfully');
      loadSettings();
    } catch (error) {
      showNotification('Failed to update setting: ' + error.message, 'error');
    }
  };

  const logoSetting = settings.find(s => s.setting_key === 'logo_url');
  const faviconSetting = settings.find(s => s.setting_key === 'favicon_url');
  const nameSetting = settings.find(s => s.setting_key === 'platform_name');

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 ${
          notification.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-green-500/10 border-green-500/30 text-green-300'
        }`}>
          {notification.type === 'error' ? <X size={20} /> : <Check size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-purple-400" size={32} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Platform Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={nameSetting?.setting_value || ''}
                onChange={(e) => handleSettingUpdate('platform_name', e.target.value)}
                onBlur={(e) => handleSettingUpdate('platform_name', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="FX Trading Dashboard"
              />
              <p className="text-slate-500 text-sm mt-2">
                This name appears in the browser tab and header
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Platform Logo
              </label>
              <div className="flex items-start gap-4">
                {logoSetting?.setting_value && (
                  <div className="w-32 h-32 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${apiUrl}/api/r2/${logoSetting.setting_value}`}
                      alt="Platform Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="block cursor-pointer">
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all">
                      {uploading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          Upload Logo
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-slate-500 text-sm mt-2">
                    Recommended: PNG or SVG, max 2MB. Displayed in the header.
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Favicon (Browser Icon)
              </label>
              <div className="flex items-start gap-4">
                {faviconSetting?.setting_value && (
                  <div className="w-16 h-16 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${apiUrl}/api/r2/${faviconSetting.setting_value}`}
                      alt="Favicon"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="block cursor-pointer">
                    <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all">
                      {uploading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon size={20} />
                          Upload Favicon
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                      onChange={handleFaviconUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-slate-500 text-sm mt-2">
                    Recommended: ICO or PNG, 32x32px or 64x64px, max 500KB
                  </p>
                  <p className="text-yellow-400 text-sm mt-1">
                    Note: Page will reload after favicon upload
                  </p>
                </div>
              </div>
            </div>

            {/* Other Settings */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">All Settings</h3>
              <div className="space-y-3">
                {settings.map(setting => (
                  <div key={setting.setting_key} className="flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{setting.setting_key}</p>
                      <p className="text-slate-400 text-sm">{setting.description}</p>
                    </div>
                    <div className="text-slate-300 text-sm font-mono">
                      {setting.setting_type === 'image' && setting.setting_value ? (
                        <span className="text-green-400">✓ Uploaded</span>
                      ) : setting.setting_value || 'Not set'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformSettings;
