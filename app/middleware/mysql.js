const fp = require('lodash/fp');

function include(includeMapping, include, options) {
  if(!include){
    return fp.map(pair=>{
      const key = fp.head(pair);
      const value = fp.last(pair);
      return value(fp.getOr(null)(key)(options));
    })(fp.toPairs(includeMapping))
  }
  else {
    return fp.compact(fp.map(key => {
      const value = fp.getOr(null)(key)(includeMapping);
      return value && value(fp.getOr(null)(key)(options))
    })(include));
  }
}

function isInclude(include, key) {
  if(!include){
    return true;
  }
  return fp.contains(key)(include);
}

module.exports = {
  include,
  isInclude
};