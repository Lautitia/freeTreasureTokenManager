const fp = require('lodash/fp');
const schedule = require('node-schedule');
const config = require('config');
const restifyClients = require('restify-clients');

class YouZhanToken {
  constructor() {
    //
    this.clientId = '';
    this.clientSecret = '';
    this.kdtId = 0;

    this.run();
  }

  async generate() {
    // const url = `https://open.youzan.com/oauth/token`;
    const params = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'silent',
      kdt_id: this.kdtId,
    };

    const client = restifyClients.createJsonClient({
      url: 'https://open.youzan.com'
    });

    client.post('/oauth/token', params, async(err, req, res, result)=>{
      try {
        const accessToken = fp.getOr(null)('access_token')(result);

        await service.v100.accessToken.update(this.clientId, accessToken, 0);

        log.info('update youzanAccessToken: ', result);
      }
      catch (err) {
        log.error(err, result);
      }
    });
  }

  async run() {
    const record = fp.head(await service.v100.accessToken.list({type: 'youzan'}));
    if(fp.isEmpty(record)){
      return log.error('get youzan appid/appsecret empty');
    }

    this.clientId = record.app_id;
    this.clientSecret = record.app_secret;
    this.kdtId = fp.getOr(0)('extra_data.kdt_id')(record);

    const format = '0 */24 * * *';
    await this.generate();
    schedule.scheduleJob(format, async () => {
      log.info('youzan accessToken start');
      await this.generate();
    });
  }
}

module.exports = YouZhanToken;