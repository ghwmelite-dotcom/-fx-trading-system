//+------------------------------------------------------------------+
//|                                  BollingerBands_Breakout.mq5     |
//|                             Bollinger Bands Breakout Strategy     |
//|                                                                  |
//+------------------------------------------------------------------+

// Input parameters
input int BB_Period = 20;
input double BB_Deviation = 2.0;
input double LotSize = 0.1;
input int StopLoss = 60;
input int TakeProfit = 120;
input int MagicNumber = 99999;
input int MaxTrades = 1;

// Global variables
int ticket;
int tradesCount;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
  ticket = 0;
  tradesCount = 0;
  Print("Bollinger Bands Breakout EA initialized");
  return 0;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit()
{
  Print("Bollinger Bands Breakout EA stopped");
  Print("Total trades executed: ", tradesCount);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
  // Get Bollinger Bands values
  double upperBand = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, 0, 1, 1);
  double middleBand = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, 0, 0, 1);
  double lowerBand = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, 0, 2, 1);

  double currentClose = iClose(Symbol(), Period(), 1);
  double prevClose = iClose(Symbol(), Period(), 2);

  // Check current positions
  int hasPosition = 0;
  for(int i = 0; i < OrdersTotal(); i++)
  {
    if(OrderSelect(i, 0, 0))
    {
      if(OrderMagicNumber() == MagicNumber)
      {
        hasPosition = 1;
        ticket = OrderTicket();
      }
    }
  }

  // Entry logic - only if max trades not reached
  if(hasPosition == 0 && tradesCount < MaxTrades)
  {
    // Buy when price breaks above upper band
    if(prevClose <= upperBand && currentClose > upperBand)
    {
      double sl = Bid() - StopLoss * Point();
      double tp = Bid() + TakeProfit * Point();

      ticket = OrderSend(Symbol(), 0, LotSize, Ask(), 3, sl, tp, "BB Upper Breakout", MagicNumber, 0, 0);

      if(ticket > 0)
      {
        Print("Buy order opened - Price broke above upper band");
        tradesCount = tradesCount + 1;
      }
    }

    // Sell when price breaks below lower band
    if(prevClose >= lowerBand && currentClose < lowerBand)
    {
      double sl = Ask() + StopLoss * Point();
      double tp = Ask() - TakeProfit * Point();

      ticket = OrderSend(Symbol(), 1, LotSize, Bid(), 3, sl, tp, "BB Lower Breakout", MagicNumber, 0, 0);

      if(ticket > 0)
      {
        Print("Sell order opened - Price broke below lower band");
        tradesCount = tradesCount + 1;
      }
    }
  }

  // Exit logic - close when price returns to middle band
  if(hasPosition == 1)
  {
    if(OrderSelect(ticket, 0, 0))
    {
      int orderType = OrderType();

      // Close buy when price returns to or below middle band
      if(orderType == 0 && currentClose <= middleBand)
      {
        if(OrderClose(ticket, LotSize, Bid(), 3, 0))
        {
          Print("Buy order closed - Price returned to middle band");
          ticket = 0;
        }
      }

      // Close sell when price returns to or above middle band
      if(orderType == 1 && currentClose >= middleBand)
      {
        if(OrderClose(ticket, LotSize, Ask(), 3, 0))
        {
          Print("Sell order closed - Price returned to middle band");
          ticket = 0;
        }
      }
    }
  }
}
//+------------------------------------------------------------------+
