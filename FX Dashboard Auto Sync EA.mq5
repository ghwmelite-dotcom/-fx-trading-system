//+------------------------------------------------------------------+
//|                                       FX Dashboard Auto Sync.mq5 |
//|                                  Auto-sync trades to dashboard   |
//|                        Place in MT5/MQL5/Experts folder          |
//+------------------------------------------------------------------+
#property copyright "FX Dashboard Auto Sync"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

// Input parameters - CONFIGURE THESE
input string API_URL = "https://fx-dashboard-api.ghwmelite.workers.dev/api/mt4-webhook";  // Your Worker URL
input string API_KEY = "YOUR_API_KEY_HERE";  // Your API key (get from: wrangler secret list)
input int    ACCOUNT_ID = 1;  // Account ID in your dashboard
input int    CHECK_INTERVAL = 60;  // Check for new closed trades every N seconds

// Global variables
datetime lastCheckTime = 0;
string lastSyncedTickets = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("FX Dashboard Sync EA Initialized");
   Print("API URL: ", API_URL);
   Print("Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
   
   // Enable WebRequest for the API URL
   Print("Make sure to add ", API_URL, " to allowed URLs in Tools > Options > Expert Advisors");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("FX Dashboard Sync EA Stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for closed trades periodically
   if(TimeCurrent() - lastCheckTime >= CHECK_INTERVAL)
   {
      SyncClosedTrades();
      lastCheckTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Sync all closed trades to dashboard                             |
//+------------------------------------------------------------------+
void SyncClosedTrades()
{
   // Get history for the last 30 days
   datetime fromDate = TimeCurrent() - (30 * 24 * 60 * 60);
   datetime toDate = TimeCurrent();
   
   HistorySelect(fromDate, toDate);
   
   int totalDeals = HistoryDealsTotal();
   
   for(int i = totalDeals - 1; i >= 0; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      
      // Only sync actual trades (entry/exit), not balance operations
      ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT) continue;
      
      // Get deal type
      ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;
      
      // Check if already synced
      string ticketStr = IntegerToString(ticket);
      if(StringFind(lastSyncedTickets, ticketStr) >= 0) continue;
      
      // Get position ticket to find entry price
      ulong positionTicket = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      
      // Find entry deal for this position
      double entryPrice = 0;
      datetime openTime = 0;
      for(int j = 0; j < totalDeals; j++)
      {
         ulong entryTicket = HistoryDealGetTicket(j);
         if(HistoryDealGetInteger(entryTicket, DEAL_POSITION_ID) == positionTicket)
         {
            ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(entryTicket, DEAL_ENTRY);
            if(entry == DEAL_ENTRY_IN)
            {
               entryPrice = HistoryDealGetDouble(entryTicket, DEAL_PRICE);
               openTime = (datetime)HistoryDealGetInteger(entryTicket, DEAL_TIME);
               break;
            }
         }
      }
      
      if(entryPrice == 0) continue; // Skip if we couldn't find entry
      
      // Get trade details
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double exitPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      datetime closeTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      
      // Determine if it was a buy or sell
      string tradeType = (dealType == DEAL_TYPE_BUY) ? "sell" : "buy"; // Exit deal type is opposite
      
      // Prepare trade data
      string jsonData = PrepareTradeJSON(
         ticket,
         symbol,
         tradeType,
         volume,
         entryPrice,
         exitPrice,
         profit,
         closeTime
      );
      
      // Send to API
      if(SendToAPI(jsonData))
      {
         Print("Trade synced: ", ticket, " (", symbol, " ", profit, ")");
         
         // Mark as synced
         if(lastSyncedTickets == "")
            lastSyncedTickets = ticketStr;
         else
            lastSyncedTickets = lastSyncedTickets + "," + ticketStr;
      }
      else
      {
         Print("Failed to sync trade: ", ticket);
      }
   }
}

//+------------------------------------------------------------------+
//| Prepare trade data as JSON                                       |
//+------------------------------------------------------------------+
string PrepareTradeJSON(ulong ticket, string symbol, string type, 
                       double lots, double openPrice, double closePrice, 
                       double profit, datetime closeTime)
{
   MqlDateTime dt;
   TimeToStruct(closeTime, dt);
   string dateStr = StringFormat("%04d-%02d-%02d", dt.year, dt.mon, dt.day);
   
   string json = "{";
   json += "\"ticket\":" + IntegerToString(ticket) + ",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"type\":\"" + type + "\",";
   json += "\"lots\":" + DoubleToString(lots, 2) + ",";
   json += "\"openPrice\":" + DoubleToString(openPrice, 5) + ",";
   json += "\"closePrice\":" + DoubleToString(closePrice, 5) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"closeTime\":\"" + dateStr + "\",";
   json += "\"accountId\":" + IntegerToString(ACCOUNT_ID);
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Send data to API using WebRequest                               |
//+------------------------------------------------------------------+
bool SendToAPI(string jsonData)
{
   string headers = "Content-Type: application/json\r\n";
   headers += "X-API-Key: " + API_KEY + "\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   // Convert string to char array
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   int timeout = 5000; // 5 seconds
   
   ResetLastError();
   int res = WebRequest(
      "POST",
      API_URL,
      headers,
      timeout,
      post,
      result,
      resultHeaders
   );
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("WebRequest error: ", error);
      if(error == 4060)
      {
         Print("ERROR: URL not allowed! Add ", API_URL, " to Tools > Options > Expert Advisors > Allow WebRequest for listed URL");
      }
      return false;
   }
   
   if(res == 200 || res == 201)
   {
      return true;
   }
   
   Print("API returned error code: ", res);
   return false;
}

//+------------------------------------------------------------------+
//| INSTALLATION INSTRUCTIONS FOR MT5:                               |
//|                                                                  |
//| 1. Save this file as "FXDashboardSync.mq5"                      |
//| 2. Copy to: MT5/MQL5/Experts/ folder                            |
//| 3. Compile in MetaEditor (F7)                                   |
//| 4. Restart MetaTrader 5                                         |
//| 5. Go to Tools > Options > Expert Advisors                      |
//| 6. Enable "Allow WebRequest for listed URL"                     |
//| 7. Click "Add" and enter your Worker URL                        |
//|    Example: https://fx-dashboard-api.your-name.workers.dev      |
//| 8. Drag this EA onto any chart                                  |
//| 9. In inputs, set:                                              |
//|    - API_URL: Your Cloudflare Worker URL                        |
//|    - API_KEY: Your secret API key                               |
//|    - ACCOUNT_ID: 1 (or your account ID from dashboard)          |
//| 10. Click OK - trades will auto-sync every 60 seconds!         |
//|                                                                  |
//| FOR PROP FIRMS: Works with FTMO, The5ers, MyForexFunds,        |
//| FundedNext, and any prop firm using MetaTrader 5!              |
//+------------------------------------------------------------------