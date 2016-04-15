var physics = require('./server/serverPhis.js');
var socketProxy = require('./server/socketProxy.js');
var config = require('./config').server;
var clientConfig = require('./config').client;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var THREE = require('three');
var CANNON = require('cannon');
var mysql = require('mysql');
var mongoose = require('mongoose');
var _istackid = 0;
var debugItem, itemName, cubeItem;
var User = {};
var groundItems = [];

var connection = config.enableMysql ? mysql.createConnection({
	host: config.mysql.hostname,
	user: config.mysql.username,
	password: config.mysql.password,
	database: config.mysql.database
}) : null;

mongoose.connect('mongodb://localhost/game');
var db = mongoose.connection;

Object.size = function(obj) {
	var size = 0,
		key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};
Object.allFalse = function(obj) {
	for (var i in obj) {
		if (i === 'angle') continue;
		if (obj[i] === true) return false;
	}
	return true;
}

var dbUserSchema = mongoose.Schema({
	name: String,
	position: {
		x: {type : Number, default : 0},
		y: {type : Number, default : 0},
		z: {type : Number, default : 0}
	},
	health: {type : Number, default : 100},
	keyConfig: {
		forward: {type : Number, default : 0},
		back: {type : Number, default : 0},
		left: {type : Number, default : 0},
		right: {type : Number, default : 0},
		up: {type : Number, default : 0},
		down: {type : Number, default : 0},
		reset: {type : Number, default : 0},
		chat: {type : Number, default : 0},
		inventory: {type : Number, default : 0}
	},
	items: mongoose.Schema.Types.Mixed
});
var dbUser = db.model('User', dbUserSchema);
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
	physics.initCannon();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded());
	app.all('/config.json', function(req, res) {
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(clientConfig));
	});
	app.use(express.static(__dirname + '/'));
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});
	debugItem = new Item("debugItem");
	cubeItem = new Item("cubeItem");
	io.on('connection', function(socket) {
		var userName = "";
		var keysBeingPressed = false;
		socket.emit('user count', Object.size(User));
		socket.on('getKeyConfig', function(name) {
			dbUser.findOne({'name':name},function(err,data) {
				if(err) return console.err(err);
				io.emit('keyConfig',{name:name,config:data.keyConfig})
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
			User[userName] = new THREE.Object3D();
			if (config.enableMysql) {
				connection.query('SELECT * FROM ' + config.mysql.table, function(err, rows, fields) {
					for (var i = 0; i < rows.length; i++) {
						if (rows[i].Username == user.cookie && rows[i].Password == user.hashedPassword) {
							userName = user.cookie;
							User[userName].posSaved = true;
							break;
						}
					}
					dbUser.findOne({name:userName},function(err,data){
						if(err) return console.error(err);
						console.log(data);
						if(User[userName].posSaved) {
							if(!data) {
								User[userName].db = new dbUser({name:userName});
							} else {
								User[userName].db = data;
							}
							User[userName].keyConfig = user.keyConfig;
							User[userName].phisObj.position.copy(User[userName].db.position);
							User[userName].position.copy(User[userName].db.position);
						}
					});
				});
			}
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


			socket.broadcast.emit('chat message', user.name + " Joined!");
		});
		socket.on('keys pressed', function(keys) {
			if (typeof User[userName] !== "undefined") {
				User[userName].keysBeingPressed = true;
				User[userName].key = keys;
				User[userName].keysBeingPressed = Object.allFalse(keys);
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
				// 				if(User[userName].posSaved) {
				// 				}
				if(User[userName].posSaved) {
					console.info("saving userData");
					User[userName].db.position = { x :User[userName].position.x, y: User[userName].position.y, z : User[userName].position.z};
					User[userName].db.keyConfig = User[userName].keyConfig;
					User[userName].db.items = User[userName].items;
					User[userName].db.save();
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
					io.emit('itemRemove', {
						id: groundItems[j].id,
						user: i,
						itemName: groundItems[j].name
					});
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