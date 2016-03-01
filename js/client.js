/*global $ THREE force initThree updatePhysics world CapsuleColider*/
var test, debugModel, cubeItem;
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
var scene, guiScene, camera, renderer, objMtlLoader, JsonLoader, gui, chatHideDelay, userName = "",
	debugItem,
	isShifted, blendMesh, testsprite, cannonDebugRenderer, cubeGeometry, cubeMaterial, clientCubeMaterial, carGeometry, carMaterial, controls, floorMaterial, wallsMaterial, light;
var color;
//create socket.io connection to server
var socket = new io('//dynalogic.org', {
	path: '/node/socket.io'
});
//initiate stats.js
var stats = new Stats();
/** object that tracks the keys pressed */
var key = {
	forward: false,
	left: false,
	back: false,
	right: false,
	q: false,
	e: false,
	chat: false,
	up: false,
	down: false,
	keyPressed: 0,
	angle: 0
};
var keycode = {
	forward : 87,
	back : 83,
	left : 65,
	right : 68,
	up : 32,
	down : 16,
	reset : 82,
	chat : 84
}
/** Object of all users @private */
var user = {};
var groundItems = [];
//so the server is only told about no keys being pressed once
var sendUpdateNoKey = true;
var directonalForce = new CANNON.Vec3(0, 0, 0);
var jumpForce = new CANNON.Vec3(0, 10, 0);
var canJump = true;
var config = loadJson('./config.json');








/**
@constructor
@param {String} name - name of item
@param {THREE.Mesh} model - model to use for the item
@param {int} [id] - id of the item
@param {function} [onUse] - callback when item is used
@param {function} [onSecondary] - callback for second ability
@return - new Item
*/
var Item = function(name, model, id, onUse, onSecondary) {
	this._unclonedModel = model;
	this.model = model.clone();
	this.name = name;
	this.id = id || Math.floor(Math.random * 10000);
	this.onUse = onUse || function() {};
	this.onSecondary = onSecondary || function() {};
	this.clone = function() {
		return new Item(this.name, this.model, this.id, this.onUse, this.onSecondary);
	}
	this.use = function() {
		return onUse();
	}
	this.secondary = function() {
		return onSecondary();
	}
	Item.allInstances.push(this);
	return this;
}
Item.allInstances = [];

/**
@constructor
@param {Item} item - what item the stack contains
@param {int} id - uuid of itemstack
@param {int} [ammount] - ammount of items in the stack
@return {ItemStack} - the new ItemStack
*/
var ItemStack = function(item, id, ammount) {
	this._unclonedItem = item;
	this.id = id;
	this.item = item;
	this.name = this.item.name;
	this.ammount = ammount || 1;
	this.model = this.item.model;
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
	ItemStack.allInstances.push(this);
	return this;
}
ItemStack.allInstances = [];





//handles the sending of keys to the server
var buttonHandler = function(keyPressed, status) {
	if (keyPressed.target === $(".chat")) return;
	switch (keyPressed.which) {
		case keycode.forward:
			key.forward = status;
			break;
		case keycode.back:
			key.back = status;
			break;
		case keycode.left:
			key.left = status;
			break;
		case keycode.right:
			key.right = status;
			break;
		case 81:
			key.q = status;
			break;
		case 69:
			key.e = status;
			break;
		case keycode.up:
			key.up = status;
			break;
		case keycode.chat:
			key.chat = status;
			break;
		case keycode.reset:
			controls.reset();
			break;
	}
	if (keyPressed.shiftKey) {
		key.down = true;
	} else {
		key.down = false;
	}
}
var registerEvents = function() {

		//called when a user joins the server
		socket.on('user joined', function(data) {
			if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
				user[data.name] = new CapsuleColider(1, 4, data.name);
				user[data.name].position.fromArray(data.position);
				user[data.name].rotation.fromArray(data.rotation);
				user[data.name].items = {};
				world.addBody(user[data.name].phisObj);
				scene.add(user[data.name].phisMesh);
				scene.add(user[data.name]);
			}
		});
		//sent when a user leaves
		socket.on('user left', function(name) {
			scene.remove(user[name]);
			scene.remove(user[name].phisMesh);
			world.removeBody(user[name].phisObj);
			delete user[name];
		});
		//meh
		socket.on('physics change', function(data) {
			if (typeof user[userName] !== "undefined") {
				user[data.name].realPosition.set(data.position.x, data.position.y, data.position.z);
				user[data.name].phisObj.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
				user[data.name].phisObj.quaternion.set(data.quaternion.x, data.quaternion.y, data.quaternion.z, data.quaternion.w);
			}
		});
		socket.on('error', function(error) {
			if (error == "user exists") {
				$("#ErrorMsg").val("Username is in use, Try annother");
				$("#ErrorMsg").show();
				registerSubmitButton();
			}
		});
		socket.on('user created', function() {
			preInit();
		});
		socket.on('item', function(data) {
			var itemPosition = -1;
			for (var i = 0; i < groundItems.length; i++) {
				if (groundItems[i].id == data.id) {
					itemPosition = i;
				}
			}
			if (itemPosition == -1) {
				switch (data.name) {
					case "debugItem":
						groundItems.push(new ItemStack(debugItem, data.id, data.ammount));
						groundItems[groundItems.length - 1].model.material.materials[0].color.setHex('0x'+randomColor().substring(1,7))
						break;
					case "cubeItem":
						groundItems.push(new ItemStack(cubeItem, data.id, data.ammount));
						groundItems[groundItems.length - 1].model.material.color.setHex('0x' + randomColor().substring(1, 7));
						break;
				}
				itemPosition = groundItems.length - 1;
				scene.add(groundItems[itemPosition].model);
			}
			groundItems[itemPosition].model.position.copy(data.position);
		});
		socket.on('itemRemove', function(id) {
			for (var i = 0; i < groundItems.length; i++) {
				if (groundItems[i].id == id) {
					scene.remove(groundItems[i].model);
					groundItems.splice(i, 1);
				}
			}
		});
		socket.on('itemHeld', function(data) {
			if (typeof user[data.name] !== "undefined") {
				user[data.name].items = data.items;
			}
		});
		socket.on('latencyCheck', function(oldTime) {
			var time = new Date().getTime();
			$("#pingDisplay").text(Math.floor((time - oldTime) / 2) + "ms");
		});
	}
	//handles the logic behind the submit button on the login screen
var submitHandler = function() {
	$('#name').off('keyup');
	registerEvents();
	registerChatSocket();
	if ($("#name").val().length > 0) {
		modelType = $(".model:checked").val();
		socket.emit('create user', {
			name: $("#name").val(),
			model: modelType,
			cookie: getCookie('login'),
			hashedPassword: getCookie('hashpass')
		});
	}
}

//call to enable the submit button on the main page
var registerSubmitButton = function() {
	$("#sendName").one('click', submitHandler);
	$('#name').on('keyup', function(e) {
		if (e.keyCode === 13) {
			$('#sendName').trigger('click');
		}
	});
}

//function that contains all logic for various things
var mainLoop = function() {
	$("#items").empty();
	if (typeof user[userName] === "undefined") return;
	key.angle = controls.getAzimuthalAngle();
	directonalForce.setZero();
	if (key.forward) {
		directonalForce.add(-Math.sin(key.angle), 0, -Math.cos(key.angle));
	} else {
		directonalForce.add(Math.sin(key.angle), 0, Math.cos(key.angle));
	}
	if (key.back) {
		directonalForce.add(Math.sin(key.angle), 0, Math.cos(key.angle));
	} else {
		directonalForce.add(-Math.sin(key.angle), 0, -Math.cos(key.angle));
	}
	if (key.left) {
		directonalForce.add(-Math.sin(key.angle + Math.PI / 2), 0, -Math.cos(key.angle + Math.PI / 2));
	} else {
		directonalForce.add(Math.sin(key.angle + Math.PI / 2), 0, Math.cos(key.angle + Math.PI / 2));
	}
	if (key.right) {
		directonalForce.add(Math.sin(key.angle + Math.PI / 2), 0, Math.cos(key.angle + Math.P / 2));
	} else {
		directonalForce.add(-Math.sin(key.angle + Math.PI / 2), 0, -Math.cos(key.angle + Math.P / 2));
	}
	if (key.up && canJump) {
		user[userName].phisObj.applyImpulse(jumpForce, user[userName].phisObj.position);
		canJump = false;
	}
	if (key.down) directonalForce.add(0, -0.25, 0);
	directonalForce.normalize();
	for (var j in user[userName].items) $("#items").append($("<li>").text(j + " - " + user[userName].items[j]));

	if (key.forward || key.back || key.left || key.right || key.q || key.e || key.up || key.down) {
		user[userName].phisObj.applyImpulse(directonalForce, user[userName].phisObj.position);
		sendUpdateNoKey = true;
		socket.emit('keys pressed', key);
	} else if (userName.length > 0) {
		user[userName].phisObj.velocity.x *= 0.75;
		user[userName].phisObj.velocity.z *= 0.75;
		if (sendUpdateNoKey) {
			sendUpdateNoKey = false;
			socket.emit('keys pressed', key);
		}
	}
	for (var i in user) {
		if(user[i].phisObj.position.distanceTo(user[i].realPosition) < 4 || i === userName) {
			user[i].phisObj.position.lerp2(user[i].realPosition, 0.1);
		} else {
			user[i].phisObj.position.copy(user[i].realPosition);
		}
	}
}

var preInit = function() {
	//console.log('preinit start');
	userName = $("#name").val();
	$('#login').hide();
	$("#threeJsRenderWindow").append(renderer.domElement);
	$('#main_window').show();
	chatHideDelay = $("#chatDelay").val();
	//addText("test",camera);
	$(document).on('keydown', function(e) {
		if(e.target.id != "msgIn") buttonHandler(e, true);
	});
	$(document).on('keyup', function(e) {
		if(e.target.id != "msgIn") buttonHandler(e, false);
	});
	user[userName] = new CapsuleColider(1, 4);

	switch (modelType) {
		case "car":
			scene.add(camera);
			user[userName].model = new THREE.Mesh(carGeometry, carMaterial);
			user[userName].model.scale.set(0.6, 0.6, 0.6);
			user[userName].model.rotateX(-Math.PI / 2);
			user[userName].model.rotateZ(Math.PI);
			user[userName].updateMatrixWorld();
			user[userName].add(user[userName].model);
			THREE.SceneUtils.attach(camera, scene, user[userName]);
			break;
		case "person":
			user[userName] = new THREE.Mesh(blendMesh.geometry, blendMesh.material);
			user[userName].scale.set(0.01, 0.01, 0.01);
			scene.add(user[userName]);
			user[userName].add(camera);
			break;
		default:
			user[userName].add(camera);
			user[userName].items = {};
	}
	scene.add(user[userName]);
	world.addBody(user[userName].phisObj);
	//scene.add(user[userName].phisMesh);
	var nameGuiElement = gui.addTextElement(userName, window.innerWidth / -2, window.innerHeight / 2 - 20, {
		textColor: "#262626"
	});

	nameGuiElement.position.x += nameGuiElement.scale.x / 2;
	
	if ($("#fpsShow").is(":checked")) {
		document.body.appendChild(stats.domElement);
	} else {
		registerSubmitButton();
	}
}

var addGroundItem = function(name, location, model, index) {
	var index1 = index || groundItems.length;
	model = model.clone();
	groundItems.splice(index1, 0, {
		name: name,
		position: location,
		model: model,
		update: function() {
			this.model.position.copy(this.position);
		}
	});
	scene.add(model);
	return groundItems.length - 1;
}

//initilise all required variables
/**
 * Init function
 * @function
 */
function init() {
	//create three.js scene / init loaders
	scene = new THREE.Scene();
	JsonLoader = new THREE.JSONLoader();
	blendMesh = new THREE.BlendCharacter();
	gui = new GUI.guiScene();
	//configure stats
	stats.setMode(0);
	stats.domElement.style.position = "absolute";
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	//init camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	scene.add(camera);
	camera.position.x = -7;
	camera.position.y = 5;
	camera.lookAt(force.zero);
	//init geometries
	planeGeom = new THREE.PlaneGeometry(30, 30);
	cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

	//lights
	light = new THREE.PointLight(0xffffff, 1, 100);
	light.position.y = 15;
	light.position.z = 5;
	light.position.x = -7;
	scene.add(light);
	//scene.add(new THREE.AmbientLight( 0xaaaaaa ));

	//init materials
	carMaterial = new THREE.MeshPhongMaterial();
	carMaterial.shading = THREE.FlatShading;
	planeMaterial = new THREE.MeshBasicMaterial({
		color: 0x9966ff,
		side: THREE.DoubleSide
	});

	cubeMaterial = new THREE.MeshBasicMaterial({
		color: 0xffa000,
		wireframe: false
	});

	clientMaterial = new THREE.MeshBasicMaterial({
		color: 0x003366,
		wireframe: false
	});

	//add static scene objects
	plane = new THREE.Mesh(planeGeom, planeMaterial);
	plane.rotation.x = Math.PI / 2;
	plane.reciveShadow = true;
	//scene.add(plane);

	test = new THREE.Mesh(cubeGeometry, cubeMaterial);
	//load externals
	JsonLoader.load('/node/model/testObject.js', function(geometry, materials) {
		var material = new THREE.MultiMaterial(materials);
		debugModel = new THREE.Mesh(geometry, material);
		debugModel.scale.set(0.1, 0.1, 0.1);
		debugItem = new Item("debugItem", debugModel);
		//scene.add( object );
	});
	blendMesh.load('model/marine_anims.js', function() {
		blendMesh.scale.set(0.01, 0.01, 0.01);
		//guiScene.add(blendMesh);
	});

	initThree(scene);
	initCannon();

	cubeItem = new Item("cubeItem", test);
	cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
	//init renderer
	renderer = new THREE.WebGLRenderer({
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enablePan = false;
	registerSubmitButton();

}
/**
 * Function to render the scene(s)
 */
function animate() {
	stats.begin();
	mainLoop();
	upadtePhysics();
	controls.update();
	cannonDebugRenderer.update();
	stats.end();

	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	gui.render(renderer);
}
//does the 'players online' bit
socket.on('user count', function(users) {
	$("#usersOnline").text(users + " online currently");
});
//socket.on(*), part of a failed project

//run init
init();
//begin rendering
animate();
//toggles hiding/showing options pannel
$(function() {
	$("#server").val(config.client.defaultServer);
	if (getCookie('login')) {
		$("#name").hide().val(getCookie('login'));
		$("#loginTypes").hide();
		$("#logoutButton").show();
	}
	$("#opts").on('click', function() {
		$("#options").toggle();
	});
});
setInterval(function() {
	socket.emit('latencyCheck', new Date().getTime());
}, 1000);

//handle window changing size
function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	//GUI.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
//register previous function
window.addEventListener('resize', onWindowResize, false);

CANNON.Vec3.prototype.lerp2 = function(v, t) {
	this.x = this.x + (v.x - this.x) * t;
	this.y = this.y + (v.y - this.y) * t;
	this.z = this.z + (v.z - this.z) * t;
	return this;
}
CANNON.Vec3.prototype.lerp3 = function(x, y, z, t) {
	this.x = this.x + (x - this.x) * t;
	this.y = this.y + (y - this.y) * t;
	this.z = this.z + (z - this.z) * t;
	return this;
}