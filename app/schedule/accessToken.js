const schedule = require('node-schedule');

class AccessToken {
  constructor() {
    //
    this.appId = '';
    this.appSecret = '';

    this.run();
  }

  async generate() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    const got = require('got');
    const data = await got(url);
    try {
      const body = JSON.parse(data.body);
      await service.v100.accessToken.update(this.appId, body.access_token, 0);
      log.info('update accessToken: ', body);
    }
    catch (err) {
      log.error(err);
    }
  }

  async run() {

    const record = fp.head(await service.v100.accessToken.list({type: 'wechat'}));
    if(fp.isEmpty(record)){
      return log.error('get wechat appid/appsecret empty');
    }

    this.appId = record.app_id;
    this.appSecret = record.app_secret;

    const format = '0 */1 * * *';
    await this.generate();
    schedule.scheduleJob(format, async () => {
      log.info('wechat accessToken start');
      await this.generate();
    });
  }
}

module.exports = AccessToken;