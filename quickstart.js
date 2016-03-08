/**

The MIT License (MIT)

Copyright (c) 2016 Logan Waldman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
var fs = require('fs');
var stdin = process.openStdin();
var itteration = 0;
var data = [];

var configData = {
  client: {},
  server: {
    mysql: {},
    enableRedis : true,
    enableMysql : true
  }
};
var infoRequested = "";
console.log("This software is licenced under the MIT licence.\nNo warnty is supplied. ect. ect.\nFor more info see the source code\n\nWelcone to the quick configurator.\nAny Values left blank will be asigned defaults (good for passwords)");
process.stdout.write("MYSQL username: ");
stdin.addListener("data", function(d) {
  switch (itteration++) {
    case 0:
      configData.server.mysql.username = d.toString().trim() || "mysqlUsername";
      process.stdout.write("Mysql password: ");
      break;
    case 1:
      configData.server.mysql.password = d.toString().trim() || "mysqlPassword";
      process.stdout.write("Mysql address: ");
      break;
    case 2:
      configData.server.mysql.hostname = d.toString().trim() || "mysqlAddress";
      process.stdout.write("Mysql database: ");
      break;
    case 3:
      configData.server.mysql.database = d.toString().trim() || "dbName";
      process.stdout.write("Mysql table:");
      break;
    case 4:
      configData.server.mysql.table = d.toString().trim() || "tableName";
      process.stdout.write("server port: ");
      break;
    case 5:
      configData.server.port = parseInt(d.toString().trim()) || 3000;
      process.stdout.write("server address: ");
      break;
    default:
      configData.client.defaultServer = d.toString().trim() || "serverAddress";
      //process.stdin.destroy();
      break;
  }
  if (itteration == 7) {
    console.log("Write file? [Y/n]");
    stdin.addListener("data", function(d) {
      if (d.toString().trim().toLowerCase().startsWith("y") || d.toString().trim() === "") {
        fs.writeFile(__dirname + "/config.json");
        process.stdin.destroy();
      } else { if(!d.toString().trim().toLowerCase().startsWith("n")) {
        console.log("Write file? [Y/n]");
      }else{process.stdin.destroy();}}

    });
  }
});