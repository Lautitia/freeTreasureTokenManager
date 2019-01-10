require('include-node');
const config = require('config');
Include('/libs/log')('freeTreasureWXAPI');
const fp = require('lodash/fp');
const moment = require('moment');
const Restify = require('restify');

global.isTestMode = ()=>{
  return false;
};
global.isDevelopMode = ()=>{
  return config.env !== 'PRODUCTION';
};

let Server = Restify.createServer();

Server.use(Restify.plugins.bodyParser());
Server.use(Restify.plugins.queryParser());
Server.use(require('restify-cookies').parse);
// Server.use(
//     function crossOrigin(req, res, next) {
//         res.header('Access-Control-Allow-Origin', 'https://www.lianxiaohu.com');
//         res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, CORRELATION_ID');
//         res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, OPTIONS');
//         res.header('Access-Control-Allow-Credentials', 'true');
//         return next();
//     },
// );
// Server.opts(/.*/, (req, res) => res.send(204));
// Server.use(async(req, res, next)=>{

  // const url = require('url');
  // const headerSession = fp.getOr(null)('headers.session')(req);
  // req.session = headerSession ? headerSession : extend.snowflake.next();
  // const resourceName = url.parse(req.url).pathname;
  // log.request(req.session, resourceName, req.query, req.params, req.body);
  //
  // const send = res.send;
  // res.send = function (string) {
  //     res.send = send;
  //     log.response(req.session, extend.snowflake.diff(req.session), resourceName);
  //     send.call(this, string);
  // };

  // const parameters = fp.getOr(null)('body')(req) || fp.getOr(null)('param')(req);
  //
  // if(config.enableAuth) {
  //   const appId = fp.getOr(null)('u')(parameters);
  //
  //   const passport = await middleware.v100.passport.find(appId);
  //   if (!passport) {
  //     return res.send(404);
  //   }
  //
  //   //check accessable
  //   if (!middleware.v100.role.checkPrivilege(passport, resourceName)) {
  //     return res.send(403);
  //   }
  //
  //   if (!middleware.v100.passport.verify(parameters)) {
  //     log.error('verify failed: ', parameters);
  //     return res.send(403);
  //   }
  //
  //   req.passport = passport;
  // }
  // req.resourceName = resourceName;

//   next();
// });

(async()=>{
  await Include('/libs/enumServices').load('middleware', 'app/middleware');
  await Include('/libs/enumServices').load('service', 'app/service');
  await Include('/libs/enumServices').load('extend', 'app/extend');
  await Include('/libs/enumServices').load('schedule', 'app/schedule');

  Include('/libs/enumAPI').load(
      Server,
      ['app/controller']
  );

  Server.listen(config.port, function () {
    log.info('wxapi running on %s:%d', Server.address().address, Server.address().port);
  });
})();
