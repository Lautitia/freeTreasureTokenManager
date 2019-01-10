/*
 * 错误码列表
 * */
const fp = require('lodash/fp');

const errorCodeList = {
  'OK': 0,

  //系统错误
  'DATABASEEXEC': 90000001,   //数据库执行错误
  'ACCESSDENIED': 90000002,   //拒绝访问(侧重于访问)
  'LOGINWITHOUTPARAM': 90000003,  //登录失败缺少参数
  'PERMISSIONDENIED': 90000004,   //权限不足(侧重于权限)
  'NOTLOGINYET': 90000005,        //未登录
  'AUTHFAILED': 90000006,        //身份验证失败,检查请求的参数
  'SIGNATUREFAILED': 90000007,    //签名校验失败
  'RETRYLATER':           90000008,   //稍后重试
  'NOTSUPPORT':           90000009,   //不支持该项服务
  'AUTHORITYDUMPLICATE':  90000010,   //权限重复
  'LOCKDUMPLICATE':     90000011,   //锁冲突

  //业务错误
  'USERNOTEXISTS':        20000001,   //用户不存在
  'COINNOTEXISTS':        20000002,   //货币不存在
  'PARAMETERMISSED':      20000003,   //参数不全
  'ACTIVITIESOVER':       20000004,   //活动已经结束
  'ACTIVITIESATTENDED':   20000005,   //活动已经参加
  'ACTIVITIESATTENDDENIED': 20000006,   //活动无法参加
  'TIMETYPEERROR':        20000007,   //时间类型错误
  'DUPLICATEREQUEST':     20000008,   //重复请求
  'REQUESTUNMATCH':       20000012,   //请求无法匹配
  'BUILDFAILED':          20000021,   //生成失败
  'MOBILENOTEXISTS':      20000025,   //手机号码不存在
  'STRATEGYUNSUPPORT':    20000029,   //策略不支持
  'PARAMETEROVERFLOW':    20000031,   //参数溢出
  'PARAMETERERROR':       20000032,   //参数错误
  'AUTHCODEINVALID':      20000033,   //验证码无效
};

const errorMessageList = {
  'OK': '',
  'DATABASEEXEC': '数据库执行错误',
  'ACCESSDENIED': '拒绝访问',
  'USERNOTEXISTS': '用户不存在',
  'LOGINWITHOUTPARAM': '登录失败,缺少参数',
  'PERMISSIONDENIED': '权限不足',
  'NOTLOGINYET': '未登录',
  'AUTHFAILED': '身份验证失败',
  'LOGINFAILED': '身份验证失败',
  'SIGNATUREFAILED': '签名校验失败',
  'RETRYLATER': '稍后重试',
  'NOTSUPPORT': '不支持该项服务',
  'AUTHORITYDUMPLICATE': '权限重复',
  'LOCKDUMPLICATE': '锁冲突',

  'COINNOTEXISTS': '货币不存在',
  'PARAMETERMISSED': '参数不全',
  'ACTIVITIESOVER': '活动已经结束',
  'ACTIVITIESATTENDED': '活动已经参加',
  'ACTIVITIESATTENDDENIED': '活动无法参加',
  'TIMETYPEERROR': '时间类型错误',
  'DUPLICATEREQUEST': '重复请求',
  'REQUESTUNMATCH': '请求无法匹配',
  'CASHNOTENOUGH': '可用资金不足',
  'BUILDFAILED': '生成失败',
  'MOBILENOTEXISTS': '手机号码不存在',
  'STRATEGYUNSUPPORT': '策略不支持',
  'PARAMETEROVERFLOW': '参数溢出',
  'PARAMETERERROR': '参数错误',
  'AUTHCODEINVALID': '验证码无效',
};


const errorCode2Message = fp.fromPairs(
  fp.map(key=>{
    return [errorCodeList[key], errorMessageList[key]];
  })(fp.keys(errorMessageList))
);

module.exports = fp.assign(
  {code: errorCodeList},
  {ack: (code, result = null)=>{
    let message = errorCode2Message[code];
    let ret = {
      code: code,
      message: message
    };
    if(result){
      ret.result = result;
    }
    return ret;
  }}
);