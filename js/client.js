/*global $ THREE force initThree updatePhysics world CapsuleColider*/

var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
var scene, guiScene, camera, renderer, objMtlLoader, JsonLoader, gui, chatHideDelay, userName = "",
	isShifted, blendMesh, testsprite, cannonDebugRenderer, cubeGeometry, cubeMaterial, clientCubeMaterial, carGeometry, carMaterial, controls, floorMaterial, wallsMaterial, light;
//create socket.io connection to server
var socket = new io('//dynalogic.org', {
	path: '/node/socket.io'
});
//initiate stats.js
var stats = new Stats();
/** object that tracks the keys pressed */
var key = {
	w: false,
	a: false,
	s: false,
	d: false,
	q: false,
	e: false,
	t: false,
	space: false,
	shift: false,
	keyPressed: 0,
	angle: 0
};
/** Object of all users @private */
var user = {};
//so the server is only told about no keys being pressed once
var sendUpdateNoKey = true;
var directonalForce = new CANNON.Vec3(0, 0, 0);
var jumpForce = new CANNON.Vec3(0, 10, 0);
var canJump = true;
var config = loadJson('./config.json');
//handles the sending of keys to the server
var buttonHandler = function(keyPressed, status) {
	if (keyPressed.target === $(".chat")) return;
	switch (keyPressed.which) {
		case 87:
			key.w = status;
			break;
		case 83:
			key.s = status;
			break;
		case 65:
			key.a = status;
			break;
		case 68:
			key.d = status;
			break;
		case 81:
			key.q = status;
			break;
		case 69:
			key.e = status;
			break;
		case 32:
			key.space = status;
			break;
		case 84:
			key.t = status;
			break;
		case 82:
			controls.reset();
			break;
	}
	if (keyPressed.shiftKey) {
		key.shift = true;
	} else {
		key.shift = false;
	}
}
var registerEvents = function() {

		//called when a user joins the server
		socket.on('user joined', function(data) {
			if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
				//userName = data.name;
				//user[data.name] = new PhysicsSphere();
				user[data.name] = new CapsuleColider(1, 4, data.name);
				user[data.name].position.fromArray(data.position);
				user[data.name].rotation.fromArray(data.rotation);
				world.addBody(user[data.name].phisObj);
				scene.add(user[data.name].phisMesh);
				scene.add(user[data.name]);
				//user[data.name].addText(data.name);
			}
		});
		//sent when a user leaves
		socket.on('user left', function(name) {
			//console.log(name);
			scene.remove(user[name]);
			scene.remove(user[name].phisMesh);
			world.removeBody(user[name].phisObj);
			delete user[name];
		});
		//meh
		socket.on('physics change', function(data) {
			if (typeof user[userName] !== "undefined") {
				//console.log(data);
				user[data.name].phisObj.position.set(data.position.x, data.position.y, data.position.z);
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
			//console.log('meh');
			preInit();
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
			cookie: getCookie('login')
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
	key.angle = controls.getAzimuthalAngle();
	directonalForce.setZero();
	if (key.w) directonalForce.add(-Math.sin(key.angle), 0, -Math.cos(key.angle));
	if (key.s) directonalForce.add(Math.sin(key.angle), 0, Math.cos(key.angle));
	if (key.a) directonalForce.add(-Math.sin(key.angle + Math.PI / 2), 0, -Math.cos(key.angle + Math.PI / 2));
	if (key.d) directonalForce.add(Math.sin(key.angle + Math.PI / 2), 0, Math.cos(key.angle + Math.P / 2));
	if (key.space && canJump) {
		user[userName].phisObj.applyImpulse(jumpForce, user[userName].phisObj.position);
		canJump = false;
	}
	if (key.shift) directonalForce.add(0, -0.25, 0);
	directonalForce.normalize();
	//if (key.q) user[userName].rotation.y += 0.1;
	//if (key.e) user[userName].rotation.y -= 0.1;
	//if (key.space) user[userName].phisObj.applyImpulse(force.up, user[userName].phisObj.position);
	//if (key.shift) user[userName].phisObj.applyImpulse(force.down, user[userName].phisObj.position);

	if (key.w || key.a || key.s || key.d || key.q || key.e || key.space || key.shift) {
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
}

var preInit = function() {
	//console.log('preinit start');
	userName = $("#name").val();
	$('#login').hide();
	$('#main_window').show();
	chatHideDelay = $("#chatDelay").val();
	//addText("test",camera);
	$(document).on('keydown', function(e) {
		buttonHandler(e, true);
	});
	$(document).on('keyup', function(e) {
		buttonHandler(e, false);
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
	}
	scene.add(user[userName]);
	world.addBody(user[userName].phisObj);
	//scene.add(user[userName].phisMesh);
	var nameGuiElement = gui.addTextElement(userName, window.innerWidth / -2, window.innerHeight / 2 - 20, {
		textColor: "#262626"
	});

	nameGuiElement.position.x += nameGuiElement.scale.x / 2;
	$("#threeJsRenderWindow").append(renderer.domElement);
	if ($("#fpsShow").is(":checked")) {
		document.body.appendChild(stats.domElement);
	} else {
		registerSubmitButton();
	}
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
	cubeGeometry = new THREE.BoxGeometry(50, 50, 50);

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

	var test = new THREE.Mesh(cubeGeometry, cubeMaterial);
	//test.position;
	//gui.addElement(test);
	//testsprite = gui.addTextElement("hello", 50,250);
	//load externals
	JsonLoader.load('/node/model/car.AnExtention', function(loadedCar) {
		carGeometry = loadedCar;
	});
	blendMesh.load('model/marine_anims.js', function() {
		blendMesh.scale.set(0.01, 0.01, 0.01);
		//guiScene.add(blendMesh);
	});

	initThree(scene);
	initCannon();

	cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
	//init renderer
	renderer = new THREE.WebGLRenderer({
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	//controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
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