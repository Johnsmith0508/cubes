var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var User = {};
exports.start = function(port)
{
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
	console.log(req);
	res.sendFile(__dirname + '/index.html');
});
//console.log(__dirname);

io.on('connection', function(socket) {
	var userName = "";
	//console.log("connect");
	socket.on('chat message',function(msg)
	{
		io.emit('chat message',{msg:msg,name:userName});
	});

	socket.on('disconect', function() {
		delete User[userName];
	});
	socket.on('keypress', function(key) {
		//console.log(key,userName);
		switch (key) {
			case 'w':
				User[userName].posX += 10;
				break;
			case 's':
				User[userName].posX -= 10;
				break;
			case 'a':
				User[userName].posZ -= 10;
				break;
			case 'd':
				User[userName].posZ += 10;
				break;
			case 'q':
				User[userName].rotY += 0.1;
				break;
			case 'e':
				User[userName].rotY -= 0.1;
		}
		socket.broadcast.emit('move', {
			name: userName,
			posX: User[userName].posX,
			posY: User[userName].posY,
			posZ: User[userName].posZ,
			rotX: User[userName].rotX,
			rotY: User[userName].rotY,
			rotZ: User[userName].rotZ
		});
		socket.emit('move', {
			name: userName,
			posX: User[userName].posX,
			posY: User[userName].posY,
			posZ: User[userName].posZ,
			rotX: User[userName].rotX,
			rotY: User[userName].rotY,
			rotZ: User[userName].rotZ
		});
	});

	socket.on('user', function(name) {
		console.log(name + " connected");
		userName = name.toString();
		User[name] = {
			posX: 0,
			posY: 0,
			posZ: 0,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		};
		socket.broadcast.emit('move', {
			name: userName,
			posX: User[name].posX,
			posY: User[name].posY,
			posZ: User[name].posZ,
			rotX: User[name].rotX,
			rotY: User[name].rotY,
			rotZ: User[name].rotZ
		});
		socket.emit('move', {
			name: userName,
			posX: User[name].posX,
			posY: User[name].posY,
			posZ: User[name].posZ,
			rotX: User[name].rotX,
			rotY: User[name].rotY,
			rotZ: User[name].rotZ
		});
	});

	socket.on('translate', function(object) {
		User[userName].posX = object.posX;
		User[userName].posY = object.posY;
		User[userName].posZ = object.posZ;

		socket.broadcast.emit('move', {
			name: userName,

			posX: object.posX,
			posY: object.posY,
			posZ: object.posZ,

			rotX: User[userName].rotX,
			rotY: User[userName].rotY,
			rotZ: User[userName].rotZ
		});
	});
});


  http.listen(port, function() {
  	console.log('listening on '+ port);
  });
}
