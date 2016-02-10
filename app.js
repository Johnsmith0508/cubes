var physics = require('./server/serverPhis.js');
var socketProxy = require('./server/socketProxy.js');
var config = require('./config').server;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var THREE = require('three');
var CANNON = require('cannon');
var mysql = require('mysql');
//redis
var connection = config.enableMysql ? mysql.createConnection({
	host: config.mysql.hostname,
	user: config.mysql.username,
	password: config.mysql.password,
	database: config.mysql.database
}) : null;
var redis = config.enableRedis ? require('redis') : null;
var redisClient = config.enableRedis ? redis.createClient() : null;

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
		if (i === 'angle') continue;
		if (this[i] === true) return false;
	}
	return true;
}
exports.start = function(port) {
	if (config.enableRedis) redisClient.on("error", function(err) {
		console.log(err);
	});
	if (config.enableMysql) connection.connect();
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
			for (var i in User) {
				if (i == user.name) {
					console.log('user ' + user.name + ' is in use');
					socket.emit('error', 'user exists');
					return;
				}
			}
			socket /*.broadcast.to(socket.id)*/ .emit('user created');
			console.log(user.name + " joined ");
			userName = user.name;
			if (config.enableMysql) {
				connection.query('SELECT * FROM ' + config.mysql.table, function(err, rows, fields) {
					for (var i = 0; i < rows.length; i++) {
						if (rows[i].Username == user.cookie && rows[i].Password == user.hashedPassword) {
							userName = user.cookie;
							User[userName].posSaved = true;
							break;
						}
					}
				});
			}
			User[userName] = new THREE.Object3D();
			User[userName].sid = socket.id;
			User[userName].model = user.model;
			User[userName].directionalForce = new CANNON.Vec3(0, 0, 0);
			User[userName].jumpForce = new CANNON.Vec3(0, 10, 0);
			User[userName].key = {
				w: false,
				a: false,
				s: false,
				d: false,
				q: false,
				e: false,
				shift: false,
				space: false,
				angle: 0
			}
			for (var i in User) {
				if (typeof User[i].position === "undefined") continue;
				socket.emit('user joined', {
					name: i,
					model: User[i].model,
					position: User[i].position.toArray(),
					rotation: User[i].rotation.toArray()
				});
			}
			physics.capsuleColider(1, 4, User[userName]);
			physics.world.addBody(User[userName].phisObj);
			socket.broadcast.emit('user joined', {
				name: user.name,
				model: user.model,
				position: User[user.name].position.toArray(),
				rotation: User[user.name].rotation.toArray()
			});

			if (config.enableRedis) {
				redisClient.hgetall("cubeuser:" + userName, function(err, obj) {
					if (obj !== null) {
						User[userName].phisObj.position.set(parseInt(obj.x), parseInt(obj.y), parseInt(obj.z));
					}
				});
			}
			socket.broadcast.emit('chat message', user.name + " Joined!");
		});
		socket.on('keys pressed', function(keys) {
			if (typeof User[userName] !== "undefined") {
				User[userName].keysBeingPressed = true;
				User[userName].key = keys;
				User[userName].keysBeingPressed = keys.allFalse();
			}
		});
		socket.on('chat message', function(message) {
			if (message.substring(0, 1) === "/") {
				if (message.substring(1, 10) === "debug_rot") {
					console.log(User[userName].rotation);
				}
				if (message.substring(1, 10) === "debug_pos") {
					console.log(User[userName].position);
				}
				if (message.substring(1, 5) === "kick") {
					//NOOP
				}
				return;
			}
			console.log("(chat) " + userName + " : " + message);
			socket.broadcast.emit('chat message', userName + " : " + message);
			socket.emit('chat message', userName + " : " + message);
		});

		socket.on('disconnect', function() {
			if (typeof User[userName] !== "undefined") {
				if (config.enableRedis && User[userName].posSaved) {
					redisClient.hset("cubeuser:" + userName, 'x', User[userName].position.x);
					redisClient.hset("cubeuser:" + userName, 'y', User[userName].position.y);
					redisClient.hset("cubeuser:" + userName, 'z', User[userName].position.z);
				}
				physics.world.removeBody(User[userName].phisObj);
				delete User[userName];
			}
			socket.broadcast.emit('user left', userName);
			socket.broadcast.emit('chat message', userName + " left");
			console.log(userName + " left");
		});
		socket.on('latencyCheck', function(clientTime) {
			socket.emit('latencyCheck', clientTime);
		});
	});

	http.listen(port, function() {
		console.log('listening on ' + port);
	});

	var mainLoop = function() {
		physics.updatePhysics(User);
		for (var i in User) {
			if (typeof User[i].phisObj === "undefined") continue;
			if (User[i].keysBeingPressed) {
				User[i].phisObj.velocity.x *= 0.75;
				User[i].phisObj.velocity.z *= 0.75;
			} else {
				User[i].directionalForce.setZero();
				if (User[i].key.w) User[i].directionalForce.add(-Math.sin(User[i].key.angle), 0, -Math.cos(User[i].key.angle));
				if (User[i].key.s) User[i].directionalForce.add(Math.sin(User[i].key.angle), 0, Math.cos(User[i].key.angle));
				if (User[i].key.a) User[i].directionalForce.add(-Math.sin(User[i].key.angle + Math.PI / 2), 0, -Math.cos(User[i].key.angle + Math.PI / 2));
				if (User[i].key.d) User[i].directionalForce.add(Math.sin(User[i].key.angle + Math.PI / 2), 0, Math.cos(User[i].key.angle + Math.PI / 2));
				if (User[i].key.space && User[i].canJump) {
					User[i].phisObj.applyImpulse(User[i].jumpForce, User[i].phisObj.position);
					User[i].canJump = false;
				}
				if (User[i].key.shift) User[i].directionalForce.add(0, -0.25, 0);
				User[i].directionalForce.normalize();
				User[i].phisObj.applyImpulse(User[i].directionalForce, User[i].phisObj.position);
			}
			socketProxy.sendSyncPhisUpdate(io, i, User[i].phisObj.position.toArray(), User[i].phisObj.velocity.toArray(), User[i].phisObj.quaternion.toArray());
		}
	}
	var interval = setInterval(mainLoop, 1000 / 60);
}