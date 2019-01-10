const mysql = Include('/libs/mysql');
const config = require('config');
// const fp = require('lodash/fp');

async function init() {
  return await mysql.alloc('freeTreasure', config.MySQL.freeTreasure);
}

module.exports = {
  init,
  transaction: (options)=>{
    const sequelize = require('sequelize');
    return sequelize.transaction(options)
  },
};