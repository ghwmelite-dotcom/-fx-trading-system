//+------------------------------------------------------------------+
//|                                         SimpleMA_Crossover.mq5   |
//|                                  Simple Moving Average Crossover |
//|                                                                  |
//+------------------------------------------------------------------+

// Input parameters
input int FastMA = 10;
input int SlowMA = 30;
input double LotSize = 0.1;
input int StopLoss = 50;
input int TakeProfit = 100;
input int MagicNumber = 12345;

// Global variables
int ticket;
double fastMA;
double slowMA;
double prevFastMA;
double prevSlowMA;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
  ticket = 0;
  return 0;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit()
{
  Print("EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
  // Calculate current MAs
  fastMA = iMA(Symbol(), Period(), FastMA, 0, 0, 0, 1);
  slowMA = iMA(Symbol(), Period(), SlowMA, 0, 0, 0, 1);

  // Calculate previous MAs
  prevFastMA = iMA(Symbol(), Period(), FastMA, 0, 0, 0, 2);
  prevSlowMA = iMA(Symbol(), Period(), SlowMA, 0, 0, 0, 2);

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

  // Bullish crossover - Fast MA crosses above Slow MA
  if(prevFastMA <= prevSlowMA && fastMA > slowMA && hasPosition == 0)
  {
    double sl = Bid() - StopLoss * Point();
    double tp = Bid() + TakeProfit * Point();

    ticket = OrderSend(Symbol(), 0, LotSize, Ask(), 3, sl, tp, "MA Cross Buy", MagicNumber, 0, 0);

    if(ticket > 0)
    {
      Print("Buy order opened: ", ticket);
    }
  }

  // Bearish crossover - Fast MA crosses below Slow MA
  if(prevFastMA >= prevSlowMA && fastMA < slowMA && hasPosition == 0)
  {
    double sl = Ask() + StopLoss * Point();
    double tp = Ask() - TakeProfit * Point();

    ticket = OrderSend(Symbol(), 1, LotSize, Bid(), 3, sl, tp, "MA Cross Sell", MagicNumber, 0, 0);

    if(ticket > 0)
    {
      Print("Sell order opened: ", ticket);
    }
  }

  // Close position on opposite crossover
  if(hasPosition == 1)
  {
    if(OrderSelect(ticket, 0, 0))
    {
      int orderType = OrderType();

      // Close buy if bearish crossover
      if(orderType == 0 && prevFastMA >= prevSlowMA && fastMA < slowMA)
      {
        if(OrderClose(ticket, LotSize, Bid(), 3, 0))
        {
          Print("Buy order closed: ", ticket);
          ticket = 0;
        }
      }

      // Close sell if bullish crossover
      if(orderType == 1 && prevFastMA <= prevSlowMA && fastMA > slowMA)
      {
        if(OrderClose(ticket, LotSize, Ask(), 3, 0))
        {
          Print("Sell order closed: ", ticket);
          ticket = 0;
        }
      }
    }
  }
}
//+------------------------------------------------------------------+
