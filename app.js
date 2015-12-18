var physics = require('./server/serverPhis.js');
var socketProxy = require('./server/socketProxy.js');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var THREE = require('three');
var CANNON = require('cannon');
var User = {};
Object.prototype.size = function() {
	var size = 0,
		key;
	for (key in this) {
		if (this.hasOwnProperty(key)) size++;
	}
	return size;
};
Object.prototype.allFalse = function() {
	for (var i in this) {
		if( i == 'angle') continue;
		if (this[i] === true) return false;
	}
	return true;
}
exports.start = function(port) {
	physics.initCannon();
	app.use(express.static(__dirname + '/'));
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});
	io.on('connection', function(socket) {
		var userName = "";
		var keysBeingPressed = false;
		socket.emit('user count', User.size());
		socket.on('create user', function(user) {
			console.log(user.name + " joined");
			userName = user.name;
			User[user.name] = new THREE.Object3D();
			User[user.name].sid = socket.id;
			User[user.name].model = user.model;
			User[user.name].directionalForce = new CANNON.Vec3(0,0,0);
			User[userName].key = {w:false,a:false,s:false,d:false,q:false,e:false,shift:false,space:false,angle:0}
			for (var i in User) {
				if(typeof User[i].position === "undefined") continue;
				socket.emit('user joined', {
					name: i,
					model: User[i].model,
					position: User[i].position.toArray(),
					rotation: User[i].rotation.toArray()
				});
			}
			physics.addPhisCube(User[userName]);
			physics.world.addBody(User[userName].phisObj);
			socket.broadcast.emit('user joined', {
				name: user.name,
				model: user.model,
				position: User[user.name].position.toArray(),
				rotation: User[user.name].rotation.toArray()
			});
			socket.broadcast.emit('chat message', user.name + " Joined!");
		});
		socket.on('keys pressed', function(keys) {
			if (typeof User[userName] !== "undefined") {
				User[userName].keysBeingPressed = true;
				User[userName].key = keys;
				//if (keys.q) User[userName].rotateY(0.1);
				//if (keys.e) User[userName].rotateY(-0.1);
				User[userName].keysBeingPressed = keys.allFalse();
			}
		});
		socket.on('chat message', function(message) {
  if (message.substring(0, 1) == "/") {
    if (message.substring(1, 10) == "debug_rot") {
      console.log(User[userName].rotation);
    }
    if (message.substring(1, 10) == "debug_pos") {
      console.log(User[userName].position);
    }
		if(message.substring(1, 5) == "kick"){
				
			}
    return;
  }
  console.log("(chat) " + userName + " : " + message);
  socket.broadcast.emit('chat message', userName + " : " + message);
  socket.emit('chat message', userName + " : " + message);
});
		socket.on('disconnect', function() {
			delete User[userName];
			socket.broadcast.emit('user left', userName);
			socket.broadcast.emit('chat message', userName + " left");
			console.log(userName + " left");
		});
	});
	http.listen(port, function() {
		console.log('listening on ' + port);
	});

	var mainLoop = function() {
		physics.updatePhysics();
		for (var i in User) {
			if(typeof User[i].phisObj === "undefined") continue;
			if (User[i].keysBeingPressed) {
				User[i].phisObj.angularVelocity.x *= 0.75;
				User[i].phisObj.angularVelocity.z *= 0.75;
			} else {
				if((User[i].key.w && User[i].key.d) || (User[i].key.s && User[i].key.a)) User[i].key.angle -= (Math.PI / 4);
				//(w and a) or (s and d)
				if((User[i].key.w && User[i].key.a) || (User[i].key.s && User[i].key.d)) User[i].key.angle += (Math.PI / 4);
				if (User[i].key.w) User[i].directionalForce.set(-Math.sin(User[i].key.angle),0,-Math.cos(User[i].key.angle));
				if (User[i].key.s) User[i].directionalForce.set(Math.sin(User[i].key.angle),0,Math.cos(User[i].key.angle));
				if (User[i].key.a && !(User[i].key.w || User[i].key.s)) User[i].directionalForce.set(-Math.sin(User[i].key.angle + (Math.PI / 2)),0,-Math.cos(User[i].key.angle + (Math.PI / 2)));
				if (User[i].key.d && !(User[i].key.w || User[i].key.s)) User[i].directionalForce.set(Math.sin(User[i].key.angle + (Math.PI / 2)),0,Math.cos(User[i].key.angle + (Math.PI / 2)));
				if (User[i].key.q || User[i].key.e || User[i].key.space || User[i].key.shift) User[i].directionalForce.set(0,0,0);
				User[i].phisObj.applyImpulse(User[i].directionalForce,User[i].phisObj.position);
			}
			socketProxy.sendSyncPhisUpdate(io,i,User[i].phisObj.position.toArray(),User[i].phisObj.velocity.toArray(),User[i].phisObj.quaternion.toArray());
		}
	}
	var interval = setInterval(mainLoop, 1000 / 60);
}