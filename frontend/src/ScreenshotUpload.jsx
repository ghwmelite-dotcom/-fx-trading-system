import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';

const ScreenshotUpload = ({ tradeId, currentScreenshot, onUploadSuccess, onDelete, apiUrl, apiKey }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentScreenshot || null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/api/trades/${tradeId}/screenshot`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.url);
        if (onUploadSuccess) {
          onUploadSuccess(data.url);
        }
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this screenshot?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/trades/${tradeId}/screenshot`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPreview(null);
        if (onDelete) {
          onDelete();
        }
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete screenshot');
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-slate-300 text-sm font-medium">Chart Screenshot</label>

      {preview ? (
        <div className="relative group">
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <img
              src={preview.startsWith('trades/') ? `${apiUrl}/r2/${preview}` : preview}
              alt="Trade screenshot"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Delete screenshot"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader className="text-purple-400 animate-spin" size={40} />
              <p className="text-slate-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <ImageIcon className="text-slate-400" size={32} />
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  Drop image here or click to upload
                </p>
                <p className="text-slate-400 text-sm">
                  PNG, JPG, GIF, WebP up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenshotUpload;
