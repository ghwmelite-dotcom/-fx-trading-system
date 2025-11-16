//+------------------------------------------------------------------+
//|                                                 RSI_Strategy.mq5  |
//|                                  RSI Oversold/Overbought Strategy |
//|                                                                  |
//+------------------------------------------------------------------+

// Input parameters
input int RSI_Period = 14;
input double RSI_Oversold = 30.0;
input double RSI_Overbought = 70.0;
input double LotSize = 0.1;
input int StopLoss = 50;
input int TakeProfit = 150;
input int MagicNumber = 54321;

// Global variables
int ticket;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
  ticket = 0;
  Print("RSI Strategy EA initialized");
  return 0;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit()
{
  Print("RSI Strategy EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
  // Calculate RSI
  double rsi = iRSI(Symbol(), Period(), RSI_Period, 0, 1);

  // Check if we have an open position
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

  // Entry conditions
  if(hasPosition == 0)
  {
    // Buy when RSI is oversold
    if(rsi < RSI_Oversold)
    {
      double sl = Bid() - StopLoss * Point();
      double tp = Bid() + TakeProfit * Point();

      ticket = OrderSend(Symbol(), 0, LotSize, Ask(), 3, sl, tp, "RSI Oversold Buy", MagicNumber, 0, 0);

      if(ticket > 0)
      {
        Print("Buy order opened at RSI: ", rsi);
      }
    }

    // Sell when RSI is overbought
    if(rsi > RSI_Overbought)
    {
      double sl = Ask() + StopLoss * Point();
      double tp = Ask() - TakeProfit * Point();

      ticket = OrderSend(Symbol(), 1, LotSize, Bid(), 3, sl, tp, "RSI Overbought Sell", MagicNumber, 0, 0);

      if(ticket > 0)
      {
        Print("Sell order opened at RSI: ", rsi);
      }
    }
  }

  // Exit conditions - close position when RSI returns to neutral
  if(hasPosition == 1)
  {
    if(OrderSelect(ticket, 0, 0))
    {
      int orderType = OrderType();

      // Close buy when RSI is back above oversold level
      if(orderType == 0 && rsi > 50.0)
      {
        if(OrderClose(ticket, LotSize, Bid(), 3, 0))
        {
          Print("Buy order closed at RSI: ", rsi);
          ticket = 0;
        }
      }

      // Close sell when RSI is back below overbought level
      if(orderType == 1 && rsi < 50.0)
      {
        if(OrderClose(ticket, LotSize, Ask(), 3, 0))
        {
          Print("Sell order closed at RSI: ", rsi);
          ticket = 0;
        }
      }
    }
  }
}
//+------------------------------------------------------------------+
