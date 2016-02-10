//run `node main.js` (this file) to run server
require('./app.js').start(process.env.PORT || require('./config.json').server.port || 3000);
