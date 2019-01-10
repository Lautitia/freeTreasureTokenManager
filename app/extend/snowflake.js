const flakeId = require('flake-idgen');
const intformat = require('biguint-format');
const bigNumber = require('bignumber.js');
const moment = require('moment');

class SnowFlake
{
  constructor(dataCenter, worker)
  {
    this.flakeIdGen = new flakeId({
      datacenter: dataCenter
      , worker: worker
    });
  }

  next(){
    return intformat(this.flakeIdGen.next(), 'dec');
  }

  diff(v){
    const time = new bigNumber(v);
    const now = moment();
    return now.valueOf() - parseInt( time.dividedBy(Math.pow(2, 22)).toNumber() );
  }
}

const snowFlake = new SnowFlake(1, 1);

module.exports = snowFlake;