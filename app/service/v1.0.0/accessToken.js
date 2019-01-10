'use strict';
const fp = require('lodash/fp');
const sequelize = require('sequelize');
const got = require('got');
const config = require('config');
const unionId = Include('/libs/unionId');

function loadAccessTokenTable() {
  const tableFormat = {
    id: {
      type: sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    app_id: {
      type: sequelize.STRING(64),
      allowNull: false
    },
    app_secret: {
      type: sequelize.STRING(256),
      allowNull: false
    },
    type: {
      type: sequelize.STRING(16),
      allowNull: false
    },
    access_token: {
      type: sequelize.STRING(512),
      allowNull: false,
      defaultValue: ''
    },
    extra_data: {
      type: sequelize.JSON,
      defaultValue: {}
    },
    expired_time: {
      type: sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    }
  };
  const options = {
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  };

  const tableName = 'access_token';
  middleware.freeTreasure[tableName] = middleware.freeTreasure.define(tableName, tableFormat, options);
}

function associations() {
}

const includeMapping = {
};

class AccessToken {

  constructor() {
  }

  async update(app_id, access_token, expired_time) {
    try {
      return await middleware.freeTreasure.access_token.update(
        {
          access_token,
          expired_time,
        },
        {
          where:{
            app_id
          }
        }
      );
    }
    catch (err) {
      log.error(err, app_id, access_token);
    }
  }

  async list(query, pagingInfo) {
    try {

      const {type} = query;

      if(pagingInfo) {

        return await middleware.freeTreasure.access_token.findAndCountAll(
          fp.assignAll([
            {
              where: fp.assignAll([
                type ? {type}:{}
              ]),
            },
            extend.helper.optionPaging(pagingInfo),
            // extend.helper.optionSortOrder(sort, order),
          ])
        );
      }
      else {
        return await middleware.freeTreasure.access_token.findAll(
          fp.assignAll([
            {
              where: fp.assignAll([
                type ? {type}:{}
              ]),
            },
            extend.helper.optionPaging(pagingInfo),
            // extend.helper.optionSortOrder(sort, order),
          ])
        );
      }
    }
    catch (err) {
      log.error(err, query, pagingInfo);
    }
  }
}

module.exports = AccessToken;