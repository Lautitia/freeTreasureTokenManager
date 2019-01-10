const Sequelize = require('sequelize');
const fp = require('lodash/fp');

async function alloc(name, config) {
    const options = fp.assign(
        {
            dialect: 'mysql',
            replication:{
                read:config.read,
                write:config.write
            },
            timezone: '+08:00',
            retry: {
                max: 0
            },
            pool: {
                maxConnections: 100,
                minConnections: 50,
                maxIdleTime: 60000
            }
        },
        config.env === 'PRODUCTION' ? {logging: false} : {logging: true}
    );
    const instance = new Sequelize(null, null, null, options);
    try {
        await instance.authenticate();
        log.info(`MySQL ${name} Connection Successful...`);
        return instance;
    }
    catch(e){
        log.error(e,  config);
    }
}

module.exports = {
  alloc
};