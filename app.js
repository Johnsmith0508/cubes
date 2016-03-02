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
var _istackid = 0;
var redis = config.enableRedis ? require('redis') : null;
var redisClient = config.enableRedis ? redis.createClient() : null;
var debugItem, itemName, cubeItem;
var User = {};
var groundItems = [];

var connection = config.enableMysql ? mysql.createConnection({
	host: config.mysql.hostname,
	user: config.mysql.username,
	password: config.mysql.password,
	database: config.mysql.database
}) : null;

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




var Item = function(name, id, onUse, onSecondary) {
	this.id = id || Math.floor(Math.random() * 1000);
	this.name = name;
	this._onUse = onUse;
	this._onSecondary = onSecondary;

	this.use = function() {
		return this._onUse();
	}
	this.secondary = function() {
		return this._onSecondary();
	}
	this.clone = function() {
		return new Item(this.name, this.id, this._onUse, this._onSecondary);
	}

	return this;
}


var ItemStack = function(item, ammount) {
	this.id = _istackid++;
	this.ammount = ammount || 1;
	this.item = item;
	this.name = item.name;
	this._unclonedItem = item;
	this.addItem = function(num) {
		num = num || 1;
		this.ammount += num;
		return this;
	}
	this.removeItem = function(num) {
		num = num || 1;
		this.ammount -= num;
		return this;
	}
	this.use = function() {
		return this.item.use();
	}
	this.secondary = function() {
		return this.item.secondary();
	}
	this.getAmmount = function() {
		return this.ammount;
	}
	this.clone = function() {
		return new ItemStack(this._unclonedItem, this.ammount);
	}
	return this;
}






exports.start = function(port) {
	if (config.enableRedis) redisClient.on("error", function(err) {
		console.error(err);
	});
	physics.initCannon();
	app.use(express.static(__dirname + '/'));
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});
	debugItem = new Item("debugItem");
	cubeItem = new Item("cubeItem");
	io.on('connection', function(socket) {
		var userName = "";
		var keysBeingPressed = false;
		socket.emit('user count', User.size());
		socket.on('getKeyConfig', function(name) {
			redisClient.hgetall("cubeuser:" + name, function(err, obj) {
				if (obj !== null) {
					io.emit('keyConfig', {
						name: name,
						config: obj.keyConfig
					});
				}
			});
		});
		socket.on('create user', function(user) {
			for (var i in User) {
				if (i == user.name) {
					console.warn('user ' + user.name + ' is in use');
					socket.emit('error', 'user exists');
					return;
				}
			}
			socket /*.broadcast.to(socket.id)*/ .emit('user created');
			console.info(user.name + " joined ");
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
			User[userName].items = {};
			User[userName].health = 100;
			User[userName].directionalForce = new CANNON.Vec3(0, 0, 0);
			User[userName].jumpForce = new CANNON.Vec3(0, 10, 0);
			User[userName].key = {
				forward: false,
				left: false,
				back: false,
				right: false,
				q: false,
				e: false,
				down: false,
				up: false,
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

			if (config.enableRedis && User[userName].posSaved) {
				redisClient.hset("cubeuser:" + userName, 'keyConfig', user.keyConfig);
				redisClient.hgetall("cubeuser:" + userName, function(err, obj) {
					if (obj !== null) {
						User[userName].phisObj.position.set(parseInt(obj.x), parseInt(obj.y), parseInt(obj.z));
						User[userName].health = obj.health || 100;
						try {
							User[userName].items = JSON.parse(obj.items);
						} catch (e) {
							console.info("Can't read empty array");
							console.warn(e);
							console.warn(e.stack);
						}
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
					console.info(User[userName].rotation);
				}
				if (message.substring(1, 10) === "debug_pos") {
					console.info(User[userName].position);
				}
				if (message.substring(1, 5) === "kick") {
					//NOOP
				}
				return;
			}
			console.info("(chat) " + userName + " : " + message);
			socket.broadcast.emit('chat message', userName + " : " + message);
			socket.emit('chat message', userName + " : " + message);
		});

		socket.on('disconnect', function() {
			if (typeof User[userName] !== "undefined") {
				if (config.enableRedis && User[userName].posSaved) {
					redisClient.hset("cubeuser:" + userName, 'x', User[userName].position.x);
					redisClient.hset("cubeuser:" + userName, 'y', User[userName].position.y);
					redisClient.hset("cubeuser:" + userName, 'z', User[userName].position.z);
					redisClient.hset("cubeuser:" + userName, 'items', JSON.stringify(User[userName].items));
					redisClient.hset("cubeuser:" + userName, 'health', User[userName].health);
				}
				physics.world.removeBody(User[userName].phisObj);
				delete User[userName];
			}
			socket.broadcast.emit('user left', userName);
			socket.broadcast.emit('chat message', userName + " left");
			console.info(userName + " left");
		});
		socket.on('latencyCheck', function(clientTime) {
			socket.emit('latencyCheck', clientTime);
		});
	});

	http.listen(port, function() {
		addGroundItem(debugItem, new CANNON.Vec3(Math.floor(Math.random() * 10), -2.5, Math.floor(Math.random() * 10)));
		addGroundItem(cubeItem, new CANNON.Vec3(Math.floor(Math.random() * 10), -2.5, Math.floor(Math.random() * 10)));
		console.info('listening on ' + port);
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
				if (User[i].key.forward) User[i].directionalForce.add(-Math.sin(User[i].key.angle), 0, -Math.cos(User[i].key.angle));
				if (User[i].key.back) User[i].directionalForce.add(Math.sin(User[i].key.angle), 0, Math.cos(User[i].key.angle));
				if (User[i].key.left) User[i].directionalForce.add(-Math.sin(User[i].key.angle + Math.PI / 2), 0, -Math.cos(User[i].key.angle + Math.PI / 2));
				if (User[i].key.right) User[i].directionalForce.add(Math.sin(User[i].key.angle + Math.PI / 2), 0, Math.cos(User[i].key.angle + Math.PI / 2));
				if (User[i].key.up && User[i].canJump) {
					User[i].phisObj.applyImpulse(User[i].jumpForce, User[i].phisObj.position);
					User[i].canJump = false;
				}
				if (User[i].key.down) User[i].directionalForce.add(0, -0.25, 0);
				User[i].directionalForce.normalize();
				User[i].phisObj.applyImpulse(User[i].directionalForce, User[i].phisObj.position);
			}
			for (var j = 0; j < groundItems.length; j++) {
				if (groundItems[j].position.distanceTo(User[i].position) <= 1) {
					itemName = groundItems[j].name;
					if (typeof User[i].items[itemName] === "undefined") {
						User[i].items[groundItems[j].name] = 1;
					} else {
						User[i].items[itemName]++;
					}
					io.emit('itemRemove', groundItems[j].id);
					groundItems[j].removeItem();
					if (groundItems[j].ammount <= 0) groundItems.splice(j, 1);
					switch (itemName) {
						case "debugItem":
							addGroundItem(debugItem, new CANNON.Vec3(Math.floor(-Math.random() * 10), -2.5, -Math.floor(Math.random() * 10)));
							break;
						case "cubeItem":
							addGroundItem(cubeItem, new CANNON.Vec3(Math.floor(Math.random() * 10), -2.5, Math.floor(Math.random() * 10)));
					}
				}
			}
			io.emit('itemHeld', {
				name: i,
				items: User[i].items
			});
			if (typeof User[i] !== "undefined") {
				socketProxy.sendSyncPhisUpdate(io, i, User[i].phisObj.position.toArray(), User[i].phisObj.velocity.toArray(), User[i].phisObj.quaternion.toArray());
			}
		}
		for (var k = 0; k < groundItems.length; k++) {
			io.emit('item', {
				name: groundItems[k].name,
				position: groundItems[k].position,
				id: groundItems[k].id
			});
		}
	}
	var addGroundItem = function(item, location) {
		groundItems.push(new ItemStack(item));
		groundItems[groundItems.length - 1].position = location;
		return groundItems.length - 1;
	}
	var interval = setInterval(mainLoop, 1000 / 60);
}