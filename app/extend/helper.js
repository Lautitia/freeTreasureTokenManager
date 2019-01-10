'use strict';
const fp = require('lodash/fp');
const moment = require('moment');
const config = require('config');

class BlowFish {
  constructor() {
    this.magicNumber = '01428570';
    const blowFish = require('egoroof-blowfish');
    this.blowFish = new blowFish('super key', blowFish.MODE.ECB, blowFish.PADDING.NULL);
    // const iv = (userId % 100000000).toString();
    this.blowFish.setIv(this.magicNumber);
  }

  encrypt(plain) {
    const v = this.blowFish.encode(plain);
    return Buffer.from(v, 'binary').toString('hex');
  }

  decrypt(plain) {
    return this.blowFish.decode(Buffer.from(plain, 'hex'));
  }
}

function sha256(plain) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(plain);
  return hash.digest('hex');
}
function generatePassWord(plain, salt) {
  return sha256(plain+salt);
}
function verifyPassWord(plain, salt, encrypt) {
  return generatePassWord(plain, salt) === encrypt;
}
function generateToken(userId, lastLogin, passWord, expires = -1) {
  const token = sha256( lastLogin+passWord );
  const blowFish = new BlowFish(userId);

  const v = blowFish.encrypt(`${userId},${lastLogin},${token},${expires}`);
  return v;
}
function decryptToken(token) {
  const blowFish = new BlowFish();
  try {
    const plain = blowFish.decrypt(token);
    const splitPlain = plain.split(',');
    return {
      userId: splitPlain[0],
      lastLogin: splitPlain[1],
      token: splitPlain[2],
      expires: splitPlain[3]
    };
  }
  catch (e) {

    return null;
  }
}

//todo: 验证码判断删除非原子
async function verifyAuthCode(userName, authCode) {
  const now = moment().unix();

  const authCodeObj = await MySQL.authCodes.findOne({
    where:{
      id: userName,
      authCode: authCode,
      expiredAt: {$gte: now}
    }
  });

  if(authCodeObj) {
    MySQL.authCodes.destroy({
      where:{
        id: userName,
      }
    });
    return true;
  }

  return false;
}

function sendSMS(userName, authCode) {
  if(config.env === 'DEBUG'){
    return;
  }
  const sms = Include('/libs/sms');
  sms.send({
    mobile: userName,
    authCode,
  }, 'sms_authcode');
}

async function sendAuthCode(userName) {

  const userAuth = await MySQL.authCodes.findById(userName);
  const now = moment().unix();
  if( now >= fp.getOr(0)('timeoutAt')(userAuth) ){
    const authCode = this.generateCode(userName, now);
    const userUpdate = {
      id: userName,
      authCode: authCode,
      timeoutAt: now+config.defaultAuthCodeTimeout,
      expiredAt: now+config.defaultAuthCodeExpired,
    };

    if(userAuth) {
      await MySQL.authCodes.destroy({where: {id: userAuth.id}});
    }
    await MySQL.authCodes.create(userUpdate);

    sendSMS(userName, authCode);
    return fp.assign(userUpdate, {id: userName});
  }
  else{
    return userAuth;
  }
}

function fetchCoinData(coins, category, time, dimension) {

  return new Promise((resolve)=>{
    let mapping = {};
    const fetch = (coins) => {
      if(!coins.length){
        return resolve(mapping);
      }
      const next = ()=>{
        setImmediate(()=>{
          fetch(fp.tail(coins));
        });
      };

      const coinId = fp.head(coins);
      MySQL.coinsData(coinId).then(
        table=>{
          table.findAll({
            where:{
              coinId: coinId,
              time: time,
              category: category,
              dimension: dimension
            },
            attributes: ['time', 'value', 'coinId']
          }).then(
            data=>{
              mapping[coinId] = data;
              next();
            }
          );
        }
      );

    };

    fetch(coins);
  });
}

function categoryFilter(filter, category) {
  return fp.filter(type=>{return filter.indexOf(type) !== -1;})(category);
}

function boolean(value, key) {
  const v = fp.getOr(null)(key)(value);
  return fp.isString(v) ? v ==='true' : v;
}

function httpGET(url) {
  const request = require('request');
  return new Promise((resolve, reject)=>{

    request(url,(err, resp, body)=>{
      const clearBody = body ? body.replace(/\n/g,'') : '{}';
      try{
        const v = JSON.parse(clearBody);
        resolve(v);
      }
      catch(e){
        log.error(e, body);
        reject(e);
      }
    });
  });
}

function pagingInfo(params) {
  // if (!params.index) {
  //   return null;
  // }

  const index = parseInt( params.index ) || 1;
  const page = params.page ? parseInt(params.page) : config.defaultPageSize;

  const skip = (index - 1) * page;
  return {
    skip,
    index,
    page,
  };
}

function parameterCheck(parameters, checklist) {
  if (!parameters || !checklist) {
    log.error('parameters or checklist null');
    return false;
  }

  return fp.every(checkItem => checkItem.indexOf('|') ?
    fp.find(a => fp.has(a)(parameters))(checkItem.split('|'))
    : fp.has(checkItem)(parameters))(checklist);
}

function pagingData(result, pagingInfo) {
  return {
    paging: {
      count: fp.getOr(0)('count')(result),
      index: pagingInfo.index,
      page: pagingInfo.page,
    },
    data: fp.getOr(0)('rows')(result)
  }
}

function whereInOrEq(tag, value) {
  return tag ? {[tag]: fp.isArray(value) ? {$in: value}:value} : {};
}
function optionPaging(pagingInfo) {
  return pagingInfo ? fp.assign(
    pagingInfo.skip?{offset: pagingInfo.skip}:{}, {limit: pagingInfo.page}
    ):{};
}
function optionSortOrder(sort, order, customer) {

  if(!sort && !customer){
    return {};
  }

  const zip = (a, b)=>{
    if(a.indexOf('.') !== -1){
      return fp.flatten( [a.split('.'), b] );
    }
    else{
      return [a, b];
    }
  };
  const zipArray = (arrayA, arrayB)=>{
    return fp.zipWith((a, b)=>{
      return zip(a, b);
    })(arrayA)(arrayB)
  };

  const padding = (sortAry, orderAry)=>{
    if(sortAry.length === orderAry.length){
      return zipArray(sortAry, orderAry);
    }
    else {
      const repeatOrder = fp.compact(fp.repeat(sortAry.length - orderAry.length + 1)(fp.last(orderAry) + ',').split(','));

      return zipArray(sortAry, repeatOrder);
    }
  };

  const sortAry = fp.uniq( fp.concat(sort ? fp.compact(sort.split(',')):[], fp.map(v=>{return fp.head(v);})(customer)) );
  const orderAry = fp.take(sortAry.length)(fp.concat(order ? fp.compact(order.split(',')):[], fp.map(v=>{return fp.last(v);})(customer)));

  return { order: padding(sortAry, orderAry) };
}
function optionOrder(sort, order, orderAry) {

  const ord = order ? fp.concat([[sort, order]], orderAry ? [orderAry] :[]) : [];

  return ord.length ? {order: ord} : {};
}

function jsonParse(json) {
  try {
    return JSON.parse(json);
  }
  catch(e) {
    return json ? json : null;
  }
}

async function restifyClientPOST(url, params) {
  return new Promise((resolve, reject)=>{
    const restifyClient = require('restify-clients');
    try {
      const client = restifyClient.createJsonClient({
        url: config.api
      });
      client.post(url, params, (err, request, response, result)=>{
        if(err) {
          return reject(err);
        }
        resolve(result);
      });
    }
    catch(err){
      log.error(err, url, params);
    }
  });
}

async function restifyClientDEL(url) {
  return new Promise((resolve, reject)=>{
    const restifyClient = require('restify-clients');
    try {
      const client = restifyClient.createJsonClient({
        url: config.api
      });
      client.del(url, (err, request, response, result)=>{
        if(err) {
          return reject(err);
        }
        resolve(result);
      });
    }
    catch(err){
      log.error(err, url);
    }
  });
}

module.exports = {
  pagingData,
  pagingInfo,
  whereInOrEq,
  optionPaging,
  optionSortOrder,
  // optionOrder,
  parameterCheck,
  jsonParse,
  keyMode(key, base) {
    return key % base;
  },
  generateCode(user, now) {
    return (parseInt(Math.random(now)* parseInt(user) ) % 10000000).toString().substr(0,6);
  },
  nextId() {
    return extend.snowflake.next();
  },
  generateSalt(userId) {
    return parseInt( Math.random(userId)*100000000 );
  },
  sha256,
  generatePassWord,
  verifyPassWord,
  generateToken,
  decryptToken,
  verifyAuthCode,
  sendAuthCode,
  fetchCoinData,
  categoryFilter,
  boolean,
  httpGET,
  restifyClientPOST,
  restifyClientDEL
};
