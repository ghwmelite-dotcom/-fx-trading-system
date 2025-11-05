import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Image as ImageIcon, Loader, Clipboard, Check, Info } from 'lucide-react';

/**
 * Quick Screenshot Capture Component
 * Supports clipboard paste, drag & drop, and file upload
 * Can store screenshot temporarily before trade is created
 */
const QuickScreenshotCapture = ({
  tradeId = null,
  onScreenshotReady,
  onClose,
  apiUrl,
  authToken,
  autoFocus = false,
  theme = 'dark'
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Check clipboard support
  useEffect(() => {
    setClipboardSupported(
      navigator.clipboard &&
      typeof navigator.clipboard.read === 'function'
    );
  }, []);

  // Auto-focus for clipboard paste
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      containerRef.current.focus();
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 3000);
    }
  }, [autoFocus]);

  // Handle paste from clipboard
  const handlePaste = async (e) => {
    e.preventDefault();

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          await processFile(blob);
          setShowPasteHint(false);
        }
        break;
      }
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Process file (validate and preview)
  const processFile = async (selectedFile) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert('File too large. Maximum size is 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);

    // If tradeId exists, upload immediately
    if (tradeId) {
      await uploadScreenshot(selectedFile);
    } else {
      // Otherwise, just store for later
      if (onScreenshotReady) {
        onScreenshotReady(selectedFile);
      }
    }
  };

  // Upload screenshot to server
  const uploadScreenshot = async (fileToUpload) => {
    if (!tradeId || !authToken) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(`${apiUrl}/api/trades/${tradeId}/screenshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (onScreenshotReady) {
          onScreenshotReady(data.url);
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
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

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const bgClass = theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onPaste={handlePaste}
      className="outline-none"
    >
      {/* Paste Hint */}
      {showPasteHint && clipboardSupported && (
        <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg animate-pulse">
          <div className="flex items-center gap-2 text-purple-300 text-sm">
            <Clipboard size={16} />
            <span>Tip: Press Ctrl+V to paste screenshot from clipboard!</span>
          </div>
        </div>
      )}

      {preview ? (
        // Preview Mode
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={`block ${textClass} text-sm font-medium`}>Screenshot Preview</label>
            {uploading ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Check size={16} />
                <span>Uploaded!</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <img
              src={preview}
              alt="Screenshot preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
          <p className={`text-xs ${secondaryTextClass}`}>
            {tradeId ? 'Screenshot uploaded successfully!' : 'Screenshot ready. It will be uploaded when you create the trade.'}
          </p>
        </div>
      ) : (
        // Upload Mode
        <div className="space-y-3">
          <label className={`block ${textClass} text-sm font-medium flex items-center gap-2`}>
            <Camera size={16} className="text-purple-400" />
            Capture Chart Screenshot
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
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
                <p className={secondaryTextClass}>Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                  <ImageIcon className="text-slate-400" size={28} />
                </div>
                <div>
                  <p className={`${textClass} font-medium mb-1 text-sm`}>
                    Drop image, paste, or click to upload
                  </p>
                  <p className={`${secondaryTextClass} text-xs`}>
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onButtonClick();
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-all"
                  >
                    Browse Files
                  </button>
                  {clipboardSupported && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        containerRef.current?.focus();
                        setShowPasteHint(true);
                        setTimeout(() => setShowPasteHint(false), 3000);
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-all flex items-center gap-1"
                    >
                      <Clipboard size={12} />
                      Paste
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className={`text-xs ${secondaryTextClass} space-y-1`}>
                <p><strong className="text-cyan-300">Quick Capture:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Take screenshot with PrtScn or Snipping Tool</li>
                  <li>Click here and press Ctrl+V to paste</li>
                  <li>Or drag & drop from your file explorer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickScreenshotCapture;
