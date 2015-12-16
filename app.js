var physics = require('./server/serverPhis.js');
var socketProxy = require('./server/socketProxy.js');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var THREE = require('three');
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
			for (var i in User) {
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
				if (keys.w) User[userName].phisObj.applyImpulse(physics.force.forward, User[userName].phisObj.position);
				if (keys.s) User[userName].phisObj.applyImpulse(physics.force.back, User[userName].phisObj.position);

				if (keys.a) User[userName].phisObj.applyImpulse(physics.force.left, User[userName].phisObj.position);
				if (keys.d) User[userName].phisObj.applyImpulse(physics.force.right, User[userName].phisObj.position);

				if (keys.space) User[userName].phisObj.applyImpulse(physics.force.up, User[userName].phisObj.position);
				if (keys.shift) User[userName].phisObj.applyImpulse(physics.force.down, User[userName].phisObj.position);

				if (keys.q) User[userName].rotateY(0.1);
				if (keys.e) User[userName].rotateY(-0.1);
				if (keys.allFalse()) {
					User[userName].keysBeingPressed = false;
				}
				socketProxy.sendPhisUpdate(socket, userName, User[userName].phisObj.position.toArray(), User[userName].phisObj.velocity.toArray(), User[userName].phisObj.quaternion.toArray);
			}
		});
		socket.on('chat message', socketProxy.chatCallback());
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
// 		for (var i in User) {
// 			if (!User[i].keysBeingPressed) {
// 				User[i].phisObj.angularVelocity.x *= 0.75;
// 				User[i].phisObj.angularVelocity.z *= 0.75;
// 			}
// 		}
	}
	var interval = setInterval(mainLoop, 1000 / 60);
}