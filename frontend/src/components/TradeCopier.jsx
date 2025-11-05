import React, { useState, useEffect } from 'react';
import { Copy, Users, CheckCircle, XCircle, Settings, Zap, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Trade Copier
 * Copy trades from master account to multiple slave accounts
 * Supports lot size multiplication and selective copying
 */
const TradeCopier = ({
  accounts = [],
  onCopyTrade,
  theme = 'dark'
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [masterAccount, setMasterAccount] = useState(accounts[0]?.id || null);
  const [slaveAccounts, setSlaveAccounts] = useState([]);
  const [lotMultiplier, setLotMultiplier] = useState(1.0);
  const [copySettings, setCopySettings] = useState({
    copySL: true,
    copyTP: true,
    copyNotes: false,
    reverseDirection: false
  });
  const [copiedTrades, setCopiedTrades] = useState([]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trade_copier_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setMasterAccount(settings.masterAccount || accounts[0]?.id);
        setSlaveAccounts(settings.slaveAccounts || []);
        setLotMultiplier(settings.lotMultiplier || 1.0);
        setCopySettings(settings.copySettings || {
          copySL: true,
          copyTP: true,
          copyNotes: false,
          reverseDirection: false
        });
        setIsEnabled(settings.isEnabled || false);
      } catch (e) {
        console.error('Failed to load trade copier settings:', e);
      }
    }
  }, [accounts]);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      masterAccount,
      slaveAccounts,
      lotMultiplier,
      copySettings,
      isEnabled
    };
    localStorage.setItem('trade_copier_settings', JSON.stringify(settings));
  };

  // Toggle slave account
  const toggleSlaveAccount = (accountId) => {
    if (accountId === masterAccount) {
      alert('Cannot copy to master account');
      return;
    }

    setSlaveAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // Copy trade to slave accounts
  const executeCopy = async (masterTrade) => {
    if (!isEnabled || slaveAccounts.length === 0) return;

    const copiedCount = slaveAccounts.length;
    const copies = slaveAccounts.map(slaveId => ({
      ...masterTrade,
      id: Date.now() + Math.random(),
      accountId: slaveId,
      size: (parseFloat(masterTrade.size) * lotMultiplier).toFixed(2),
      type: copySettings.reverseDirection
        ? (masterTrade.type === 'buy' ? 'sell' : 'buy')
        : masterTrade.type,
      stopLoss: copySettings.copySL ? masterTrade.stopLoss : null,
      takeProfit: copySettings.copyTP ? masterTrade.takeProfit : null,
      notes: copySettings.copyNotes
        ? `[COPIED from ${accounts.find(a => a.id === masterAccount)?.name}] ${masterTrade.notes || ''}`
        : `[COPIED from ${accounts.find(a => a.id === masterAccount)?.name}]`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    }));

    // Execute copies
    if (onCopyTrade) {
      copies.forEach(copy => onCopyTrade(copy));
    }

    // Log copied trade
    setCopiedTrades(prev => [
      {
        masterTrade,
        copies,
        timestamp: new Date().toISOString(),
        copiedCount
      },
      ...prev.slice(0, 9) // Keep last 10
    ]);

    saveSettings();
  };

  // Save settings when changed
  useEffect(() => {
    if (masterAccount) {
      saveSettings();
    }
  }, [masterAccount, slaveAccounts, lotMultiplier, copySettings, isEnabled]);

  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
              <Copy size={20} className="text-white" />
            </div>
            Trade Copier
          </h3>
          <p className={`text-sm ${secondaryTextClass} mt-1`}>
            Replicate trades across multiple accounts automatically
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center gap-3">
          <span className={`text-sm ${secondaryTextClass}`}>
            {isEnabled ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative w-14 h-7 rounded-full transition-all ${
              isEnabled ? 'bg-green-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isEnabled ? 'transform translate-x-7' : ''
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {isEnabled && slaveAccounts.length > 0 && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="text-green-400" size={18} />
          <span className="text-green-300 text-sm font-medium">
            Copying enabled: {accounts.find(a => a.id === masterAccount)?.name} → {slaveAccounts.length} account(s)
          </span>
        </div>
      )}

      {isEnabled && slaveAccounts.length === 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-yellow-400" size={18} />
          <span className="text-yellow-300 text-sm font-medium">
            Trade copier is enabled but no slave accounts selected
          </span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Master Account Selection */}
        <div>
          <label className={`block text-sm font-medium ${textClass} mb-2`}>
            Master Account (Source)
          </label>
          <select
            value={masterAccount || ''}
            onChange={(e) => setMasterAccount(parseInt(e.target.value))}
            className={`w-full px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${acc.balance.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Lot Size Multiplier */}
        <div>
          <label className={`block text-sm font-medium ${textClass} mb-2`}>
            Lot Size Multiplier
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.01"
              max="10"
              step="0.1"
              value={lotMultiplier}
              onChange={(e) => setLotMultiplier(parseFloat(e.target.value) || 1.0)}
              className={`flex-1 px-3 py-2 bg-slate-800 border ${borderClass} rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
            <span className={secondaryTextClass}>x</span>
          </div>
          <p className={`text-xs ${secondaryTextClass} mt-1`}>
            Slave accounts will trade {lotMultiplier}x the master lot size
          </p>
        </div>
      </div>

      {/* Slave Accounts Selection */}
      <div>
        <label className={`block text-sm font-medium ${textClass} mb-2 flex items-center gap-2`}>
          <Users size={16} />
          Slave Accounts (Destinations)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {accounts
            .filter(acc => acc.id !== masterAccount)
            .map(acc => (
              <button
                key={acc.id}
                onClick={() => toggleSlaveAccount(acc.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  slaveAccounts.includes(acc.id)
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${textClass}`}>{acc.name}</div>
                    <div className={`text-xs ${secondaryTextClass}`}>
                      ${acc.balance.toFixed(2)}
                    </div>
                  </div>
                  {slaveAccounts.includes(acc.id) && (
                    <CheckCircle className="text-cyan-400" size={20} />
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Copy Settings */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <h4 className={`text-sm font-semibold ${textClass} mb-3 flex items-center gap-2`}>
          <Settings size={16} />
          Copy Settings
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={copySettings.copySL}
              onChange={(e) => setCopySettings({ ...copySettings, copySL: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <span className={`text-sm ${textClass}`}>Copy Stop Loss</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={copySettings.copyTP}
              onChange={(e) => setCopySettings({ ...copySettings, copyTP: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <span className={`text-sm ${textClass}`}>Copy Take Profit</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={copySettings.copyNotes}
              onChange={(e) => setCopySettings({ ...copySettings, copyNotes: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <span className={`text-sm ${textClass}`}>Copy Notes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={copySettings.reverseDirection}
              onChange={(e) => setCopySettings({ ...copySettings, reverseDirection: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <span className={`text-sm ${textClass}`}>Reverse Direction</span>
          </label>
        </div>
      </div>

      {/* Recent Copies */}
      {copiedTrades.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold ${textClass} mb-3 flex items-center gap-2`}>
            <RefreshCw size={16} />
            Recent Copies
          </h4>
          <div className="space-y-2">
            {copiedTrades.slice(0, 5).map((copy, index) => (
              <div
                key={index}
                className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="text-cyan-400" size={14} />
                    <span className={`text-sm font-medium ${textClass}`}>
                      {copy.masterTrade.pair} • {copy.masterTrade.type.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs ${secondaryTextClass}`}>
                    {new Date(copy.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`text-xs ${secondaryTextClass}`}>
                  Copied to {copy.copiedCount} account(s) • {copy.masterTrade.size} → {(copy.masterTrade.size * lotMultiplier).toFixed(2)} lots
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-400 mt-0.5 flex-shrink-0" size={14} />
          <div className={`text-xs ${secondaryTextClass}`}>
            <p><strong className="text-blue-300">How it works:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
              <li>When enabled, all trades on master account are automatically copied</li>
              <li>Lot sizes are multiplied by the configured multiplier</li>
              <li>Reverse direction allows hedging strategies</li>
              <li>Each slave account receives a separate trade entry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCopier;
