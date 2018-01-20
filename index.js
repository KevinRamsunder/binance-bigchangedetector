// api wrapper
const binance = require('node-binance-api');

// terminal styler
const chalk = require('chalk');

// get hardcoded trading pairs for btc
const symbols = require('./symbols');

// import secret keys
require('dotenv').config();

// config keys
const APIKEY    = process.env.APIKEY;
const APISECRET = process.env.APISECRET;

// init binance object
binance.options({ APIKEY, APISECRET });

// init cache of symbol to { bids and asks }
const cache = {};
symbols.forEach((symbol) => {
  cache[symbol] = { bid: null, ask: null };
});

// kick off requests for each symbol
symbols.forEach((pairing) => {
  setInterval( () => {
    // start listening
    binance.depth(pairing, (error, depth, symbol) => {
      if (error) {
        console.log(`Error on: ${symbol} - ${error}`);
        return;
      }

      // get best bid and best ask
      let bestBid = binance.first(binance.sortBids(depth.bids));
      let bestAsk = binance.first(binance.sortAsks(depth.asks));

      // if new values aren't the same as the one in the cache, update and log
      if (bestBid !== cache[symbol].bid || bestAsk !== cache[symbol].ask) {
        let bidDelta = cache[symbol].bid === null ? false : (cache[symbol].bid - bestBid)/(cache[symbol].bid);
        let askDelta = cache[symbol].ask === null ? false : (cache[symbol].ask - bestAsk)/(cache[symbol].ask);

        cache[symbol].bid = bestBid;
        cache[symbol].ask = bestAsk;

        let outputSymbol = format(symbol);
        let outputBid    = color(bestBid, bidDelta);
        let outputAsk    = color(bestAsk, askDelta);

        if (bidDelta * 100 >= .5 || askDelta * 100 >= .5) {
          console.log(`Symbol: ${outputSymbol}   Best Bid: ${outputBid}   Best Ask: ${outputAsk}   ${(bidDelta*100).toFixed(2)}%  ${(askDelta*100).toFixed(2)}%`);
        }
      }
    });
  }, 1000 * 15);
});

// color based on range of val
const color = (val, delta) => {
  if ( ! delta ) {
    return val;
  }

  const percentage = delta * 100;

  if ( percentage < .5 ) {
    return val;
  } else if ( percentage < 1 ) {
    return chalk.red(val);
  } else if ( percentage < 1.5 ) {
    return chalk.yellow(val);
  } else {
    return chalk.green(val);
  }
}

// left pad
const format = ( str ) => {
  return `${' '.repeat(8-str.length)}${ str }`;
};
