const appRootPath = require('app-root-path');
const fs = require('fs');
const path = require('path');
const fp = require('lodash/fp');

exports = module.exports = function(){};

function loadModule(file)
{
  try {
    const importFile =  require(file);
    if(typeof(importFile) === 'object'){
      return importFile;
    }
    return new importFile();
  }
  catch(e){
    log.error(file, 'load error', e);
    return {};
  }
}

async function load(services) {
  //枚举api接口的所有url

  let rootPath = path.join(appRootPath.path, services);

  let traversePath = async function(basePath)
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

    let serviceList = [];
    for(const basename of files) {
        const newSubPath = path.join(basePath, basename);

        const serviceKey = basename.replace(/\./g, '');
        const extName = path.extname(basename);
        const prefixName = basename.replace(extName, '');

        //判断文件是否可用于加载
        let fsStat = fs.lstatSync(newSubPath);
        if(!fsStat.isDirectory() && !fp.contains(avaliableExtName)(extName)){
            continue;
        }

        if(fsStat.isDirectory()){
            //path
            const subServices = await traversePath( newSubPath );
            serviceList.push( [serviceKey, subServices] );
        }
        else if(extName === '.js'){
            //file
            // let relativePath = path.join('/', path.relative(rootPath, basePath).replace('/handlers', ''), basename.replace('.js', ''));
            // relativePath = path.join('/', relativePath, basename.replace('.js', ''));

            let file = path.join(basePath, basename);
            const modulePair = [prefixName, loadModule(file)];
            log.debug(services, '<=', prefixName);
            serviceList.push( modulePair );
        }
    }

    let initServices = {};
    for (const obj of serviceList) {
      const key = fp.head(obj);
      const module = fp.last(obj);
      const value = module.init && await module.init() || module;
      initServices = fp.set([key])(value)(initServices);
    }

    return initServices;
  };

  return await traversePath(rootPath);
}

exports.load = async function (name, services) {
  const service = await load(services);
  global[name] = service;
};