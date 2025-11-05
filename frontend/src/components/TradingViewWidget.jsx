import React, { useEffect, useRef, memo } from 'react';

/**
 * TradingView Widget Component
 * Embeds a TradingView chart widget for any trading instrument
 *
 * @param {string} symbol - Trading pair/symbol (e.g., "EURUSD", "EUR/USD", "XAUUSD")
 * @param {string} interval - Timeframe (1, 5, 15, 60, D, W, M)
 * @param {string} theme - "light" or "dark"
 * @param {number} height - Widget height in pixels
 */
const TradingViewWidget = memo(({
  symbol = "EURUSD",
  interval = "60",
  theme = "dark",
  height = 400
}) => {
  const container = useRef();

  // Normalize symbol format for TradingView
  const normalizeSymbol = (sym) => {
    if (!sym) return "EURUSD";

    // Remove special characters and spaces
    let normalized = sym.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Common forex pairs - add FOREX: prefix
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
                        'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPCHF'];

    // Gold and Silver
    if (normalized === 'XAUUSD' || normalized === 'GOLD') return 'OANDA:XAUUSD';
    if (normalized === 'XAGUSD' || normalized === 'SILVER') return 'OANDA:XAGUSD';

    // Crude Oil
    if (normalized === 'WTI' || normalized === 'CRUDE' || normalized === 'OIL') return 'TVC:USOIL';
    if (normalized === 'BRENT') return 'TVC:UKOIL';

    // Natural Gas
    if (normalized === 'NATGAS') return 'TVC:NATURALGAS';

    // Indices
    if (normalized === 'US30' || normalized === 'DJIA') return 'TVC:DJI';
    if (normalized === 'NAS100' || normalized === 'NASDAQ') return 'TVC:NDQ';
    if (normalized === 'SPX500' || normalized === 'SP500') return 'TVC:SPX';
    if (normalized === 'UK100' || normalized === 'FTSE') return 'TVC:UKX';
    if (normalized === 'GER40' || normalized === 'DAX') return 'XETR:DAX';
    if (normalized === 'JPN225' || normalized === 'NIKKEI') return 'TVC:NI225';

    // Metals
    if (normalized === 'COPPER') return 'TVC:COPPER';
    if (normalized === 'PLATINUM' || normalized === 'XPTUSD') return 'OANDA:XPTUSD';
    if (normalized === 'PALLADIUM' || normalized === 'XPDUSD') return 'OANDA:XPDUSD';

    // Default forex pairs - use OANDA as broker
    if (forexPairs.includes(normalized)) {
      return `OANDA:${normalized}`;
    }

    // If nothing matches, try OANDA forex format
    return `OANDA:${normalized}`;
  };

  useEffect(() => {
    // Clear previous widget
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const tvSymbol = normalizeSymbol(symbol);

    script.innerHTML = JSON.stringify({
      "autosize": false,
      "height": height,
      "width": "100%",
      "symbol": tvSymbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1", // Candles
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "support_host": "https://www.tradingview.com",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": theme === "dark" ? "rgba(15, 23, 42, 1)" : "rgba(255, 255, 255, 1)",
      "gridColor": theme === "dark" ? "rgba(51, 65, 85, 0.1)" : "rgba(200, 200, 200, 0.2)",
      "studies": [
        "MASimple@tv-basicstudies", // Moving Average
      ]
    });

    if (container.current) {
      container.current.appendChild(script);
    }

    // Cleanup
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-lg" style={{ height: `${height}px` }}>
        <div className="text-slate-400 text-sm">
          Loading TradingView chart for {symbol}...
        </div>
      </div>
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
