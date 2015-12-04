var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var THREE = require('three');
var User = {};
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
exports.start = function(port)
{
app.use(express.static(__dirname + '/'));
	
process.env.CUBESERVERPID = process.pid;
	
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
	
io.on('connection', function(socket) {
	var userName = "";
	socket.on('create user',function(user){
		console.log(user.name+" joined");
		userName = user.name;
		User[user.name] = new THREE.Object3D();
		User[user.name].sid = socket.id;
		User[user.name].model = user.model;
		for(var i in User)
			{
				socket.emit('user joined',{
					name: i,
					model: User[i].model,
					position: User[i].position.toArray(),
					rotation: User[i].rotation.toArray()
				});
			}
		socket.broadcast.emit('user joined',{
			name: user.name,
			model: user.model,
			position: User[user.name].position.toArray(),
			rotation: User[user.name].rotation.toArray()
		});
		socket.broadcast.emit('chat message',user.name +" Joined!");
	});
	socket.on('keys pressed',function(keys){
		if (typeof User[userName] !== "undefined")
		{
			if(keys.w) User[userName].translateX(0.1);
			if(keys.s) User[userName].translateX(-0.1);

			if(keys.d) User[userName].translateZ(0.1);
			if(keys.a) User[userName].translateZ(-0.1);

			if(keys.space) User[userName].translateY(0.1);
			if(keys.shift) User[userName].translateY(-0.1);

			if(keys.q) User[userName].rotateY(0.1);
			if(keys.e) User[userName].rotateY(-0.1);
			socket.broadcast.emit('position changed',{
				name : userName,
				position : User[userName].position.toArray(),
				rotation : User[userName].rotation.toArray()
			});
		}
	});
	socket.on('chat message',function(message){
		if(message.substring(0,1) == "/")
			{
				if(message.substring(1,10)=="debug_rot")
					{
						console.log(User[userName].rotation);
					}
				if(message.substring(1,10)=="debug_pos")
					{
						console.log(User[userName].position);
						//return;
					}
				return;
			}
		console.log("(chat) " + userName + " : "  + message);
		socket.broadcast.emit('chat message',userName + " : " + message);
		socket.emit('chat message',userName + " : " + message);
	});
	socket.on('disconnect',function(){
		delete User[userName];
		socket.broadcast.emit('user left',userName);
		socket.broadcast.emit('chat message',userName + " left");
		console.log(userName + " left");
	});
});


  http.listen(port, function() {
  	console.log('listening on '+ port);
  });
}