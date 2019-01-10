const appRootPath = require('app-root-path');
const fs = require('fs');
const path = require('path');
const fp = require('lodash/fp');

exports = module.exports = function(){};

function loadMethod(file)
{
  // let methodSet = {};
  try {
    const importFile =  require(file);
    if(typeof(importFile) === 'object'){
      return {};
    }
    // _.map(importFile, (func, method)=>{
    //     methodSet[method] = func;
    // });
    return new importFile();
  }
  catch(e){
    log.error(file, 'load error', e);
    return {};
  }

  // return methodSet;
}

function methodMapping(server, mapping, url, file) {
  const methods = loadMethod(file);
  fp.each(map => {
    const restifulMethod = map[0];
    const customerMethod = map[1];

    if (!methods[customerMethod]) {
      return;
    }

    log.debug(restifulMethod, customerMethod, ' ==> ', url);
    server[restifulMethod](url, (req, res, next)=>{
      return loadMethod(file)[customerMethod](req, res, next);
    });
  })(fp.toPairs(mapping));
}

function load(server, apiPath) {
  //枚举api接口的所有url

  let rootPath = path.join(appRootPath.path, apiPath);

  let traversePath = function(basePath)
  {
    const avaliableExtName = ['.js'];

    let files;
    try{
      files = fs.readdirSync(basePath);
    }
    catch(e){
      log.error('Error: ', e);
      return;
    }

    if(!files){
      return;
    }

    files.map(basename=>{
      let newSubPath = path.join(basePath, basename);
      let extName = path.extname(basename);

      //判断文件是否可用于加载
      let fsStat = fs.lstatSync(newSubPath);
      if(!fsStat.isDirectory() && !fp.contains(avaliableExtName)(extName)){
        return;
      }

      if(fsStat.isDirectory()){
        //path
        traversePath(newSubPath);
      }
      else if(extName === '.js'){
        //file
        let relativePath = path.relative(rootPath, basePath);
        relativePath = relativePath.replace('/handlers', '');
        relativePath = path.join('/', relativePath, basename.replace('.js', ''));

        let file = path.join(basePath, basename);

        const mapping = {
          'del': 'del',
          'get': 'list',
          'post': 'post',
          'put': 'put',
          'patch': 'patch'
        };

        methodMapping(server, mapping, relativePath, file);
      }
    });
  };

  traversePath(rootPath);
}

exports.load = function (server, pathArray) {
  fp.each(function (apiPath) {
    load(server, apiPath);
  })(pathArray);
};