import React, { useState, useEffect } from 'react';
import { Save, Edit2, Trash2, Plus, Check, X, Star, BookmarkPlus, Zap } from 'lucide-react';

/**
 * Trade Template Manager
 * Create, edit, delete, and load trade templates for quick entry
 */
const TradeTemplateManager = ({
  currentTrade,
  onLoadTemplate,
  accounts = [],
  theme = 'dark'
}) => {
  const [templates, setTemplates] = useState([]);
  const [showManager, setShowManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trade_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates) => {
    localStorage.setItem('trade_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  // Create new template from current trade
  const createTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      pair: currentTrade.pair || 'EUR/USD',
      type: currentTrade.type || 'buy',
      size: currentTrade.size || '',
      accountId: currentTrade.accountId || accounts[0]?.id || 1,
      createdAt: new Date().toISOString()
    };

    saveTemplates([...templates, newTemplate]);
    setTemplateName('');
    alert(`Template "${newTemplate.name}" created!`);
  };

  // Update existing template
  const updateTemplate = () => {
    if (!editingTemplate || !templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const updated = templates.map(t =>
      t.id === editingTemplate.id
        ? { ...t, name: templateName.trim() }
        : t
    );

    saveTemplates(updated);
    setEditingTemplate(null);
    setTemplateName('');
    alert('Template updated!');
  };

  // Delete template
  const deleteTemplate = (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    saveTemplates(templates.filter(t => t.id !== id));
  };

  // Load template into form
  const loadTemplate = (template) => {
    if (onLoadTemplate) {
      onLoadTemplate(template);
    }
    setShowManager(false);
  };

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className="space-y-3">
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2">
        {/* Save Current as Template */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name..."
            className={`flex-1 px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg text-sm ${textClass} placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (editingTemplate) {
                  updateTemplate();
                } else {
                  createTemplate();
                }
              }
            }}
          />
          <button
            onClick={editingTemplate ? updateTemplate : createTemplate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            title={editingTemplate ? "Update template" : "Save as template"}
          >
            {editingTemplate ? <Check size={16} /> : <Save size={16} />}
            {editingTemplate ? 'Update' : 'Save'}
          </button>
        </div>

        {/* Toggle Manager */}
        <button
          onClick={() => setShowManager(!showManager)}
          className={`px-4 py-2 ${showManager ? 'bg-blue-600' : 'bg-slate-700'} hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2`}
        >
          <BookmarkPlus size={16} />
          Templates ({templates.length})
        </button>
      </div>

      {/* Template Manager (Expandable) */}
      {showManager && (
        <div className={`${bgClass} border ${borderClass} rounded-xl p-4 space-y-3 animate-in slide-in-from-top duration-200`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${textClass} flex items-center gap-2`}>
              <Star size={16} className="text-yellow-400" />
              Saved Templates
            </h4>
            <button
              onClick={() => setShowManager(false)}
              className={secondaryTextClass + ' hover:text-white transition-colors'}
            >
              <X size={16} />
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <BookmarkPlus size={32} className="text-slate-600" />
              </div>
              <p className={secondaryTextClass + ' text-sm'}>
                No templates saved yet. Fill in the trade details above and click "Save" to create your first template.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all group"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => loadTemplate(template)}>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-purple-400" />
                      <span className={`font-medium ${textClass}`}>{template.name}</span>
                    </div>
                    <div className={`text-xs ${secondaryTextClass} mt-1 flex items-center gap-3`}>
                      <span className="flex items-center gap-1">
                        <span className={template.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {template.type.toUpperCase()}
                        </span>
                        {template.pair}
                      </span>
                      {template.size && (
                        <span>{template.size} lots</span>
                      )}
                      <span className="text-slate-600">
                        {accounts.find(a => a.id === template.accountId)?.name || 'Account'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setTemplateName(template.name);
                      }}
                      className="p-2 hover:bg-blue-600 text-slate-400 hover:text-white rounded transition-all"
                      title="Edit template name"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 hover:bg-red-600 text-slate-400 hover:text-white rounded transition-all"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => loadTemplate(template)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all ml-2"
                      title="Load template"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info */}
          {templates.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className={`text-xs ${secondaryTextClass}`}>
                💡 <strong>Tip:</strong> Click on a template to load it instantly. Your most common setups are just one click away!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Load Buttons (Show top 3 most recent) */}
      {!showManager && templates.length > 0 && (
        <div className="flex items-center gap-2">
          <span className={`text-xs ${secondaryTextClass} flex-shrink-0`}>Quick Load:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {templates.slice(-3).reverse().map((template) => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-purple-600 text-white rounded-lg text-xs transition-all flex items-center gap-1.5"
                title={`Load ${template.name}`}
              >
                <Zap size={12} />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeTemplateManager;
