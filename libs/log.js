const appRootPath = require('app-root-path');
const path = require('path');
const fs = require('fs');
const fp = require('lodash/fp');
const config = require('config');

const methods = ['tracer', 'warn', 'info', 'skill', 'error', 'debug',  'response', 'request', 'delete'];

module.exports = (appName, logPath)=>{
  logPath = logPath || 'log';
  const loggerPath = path.join(appRootPath.path, logPath);
  if(!fs.existsSync(loggerPath)){
    fs.mkdirSync(loggerPath);
  }
  const logFile = config.logfile;

  if(logFile) {
    global.log = require('tracer').dailyfile({
      root: logPath,
      methods: methods,
      allLogsFileName: appName,
      format: '[{{timestamp}}] {{ipAddress}}:{{pid}} {{appName}} {{title}} {{path}}{{relativePath}}:{{line}}:{{method}} {{message}}',
      dateformat: 'yyyy-mm-dd HH:MM:ss',
      maxLogFiles: 365,
      preprocess: function (data) {
        data.relativePath = path.relative(appRootPath.path, data.path);
        data.path = '';
        data.title = data.title.toUpperCase();
        data.pid = require('process').pid;
        data.ipAddress = require('ip').address();
        data.appName = appName;

        fp.each(data.args, function (v, i) {
          if(fp.isObject(v)){
            data.args[i] = JSON.stringify(v);
          }
        });
      }
    });
  }
  else{
    global.log = require('tracer').console({
      methods: methods
    });
  }


};