/**
* BEGIN Server Config
*/
if (typeof exports !== "undefined")
{
  exports.mysql = {};
  
  //MYSQL config
  exports.mysql.username = 'blag';
  exports.mysql.password = 'wordpass';
  exports.mysql.hostname = 'localhost';
  exports.mysql.database = 'site';
  exports.mysql.table = 'login';
} else {
  
/**
* BEGIN Client Config
*/
var defaultServer = "//dynalogic.org/node";

}