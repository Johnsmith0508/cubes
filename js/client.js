//house keeping var; not used in code
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
//define renderer vars
var scene, camera, renderer, objMtlLoader, JsonLoader;
//define app spesific vars
var chatHideDelay, userName = "", isShifted,blendMesh;
//define client model vars
var cubeGeometry, cubeMaterial, clientCubeMaterial;
var carGeometry, carMaterial;
//define vars for enviroment
var floorMaterial, wallsMaterial, light;
//create socket.io connection to server
var socket = new io('//dynalogic.org', {
	path: '/node/socket.io'
});
//initiate stats.js
var stats = new Stats();
//object that tracks keys
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
	keyPressed: 0
};
//object of all users
var user = {};
//draws names above players

//initilise all required variables
function init() {
	//create three.js scene / init loaders
	scene = new THREE.Scene();
	JsonLoader = new THREE.JSONLoader();
	blendMesh = new THREE.BlendCharacter();

	//configure stats
	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	//init camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	scene.add(camera);
	camera.position.x = -7;
	camera.position.y = 5;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//init geometries
	planeGeom = new THREE.PlaneGeometry(30, 30);
	cubeGeometry = new THREE.BoxGeometry(2, 2, 2);

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
	plane.rotation.x = (Math.PI / 2);
	plane.reciveShadow = true;
	//scene.add(plane);

	//load externals
	JsonLoader.load('/node/model/car.AnExtention', function(loadedCar) {
		carGeometry = loadedCar;
	});
	blendMesh.load('model/marine_anims.js',function(){
		blendMesh.scale.set(0.01,0.01,0.01);
		//scene.add(blendMesh);
	});
	
	initThree(scene);
	initCannon();
	//init renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	registerSubmitButton();

}
//called every frame
function animate() {
	stats.begin();
	mainLoop();
	upadtePhysics();
	stats.end();

	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

//does the 'players online' bit
socket.on('user count', function(users) {
	$("#usersOnline").text(users + " online currently");
});
var registerEvents = function() {
		//called when a user joins the server
		socket.on('user joined', function(data) {
			if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
				user[data.name] = new THREE.Object3D();
				if (data.model == "car") {
					user[data.name].model = new THREE.Mesh(carGeometry, carMaterial);
					user[data.name].model.rotateX(-Math.PI / 2);
					user[data.name].model.rotateZ(Math.PI);
					user[data.name].model.scale.set(0.6, 0.6, 0.6);
					user[data.name].add(user[data.name].model);
				} else {
					user[data.name].model = new THREE.Mesh(cubeGeometry, cubeMaterial);
					user[data.name].up.set(0, 0, 1);
				}
				user[data.name].position.fromArray(data.position);
				user[data.name].rotation.fromArray(data.rotation);
				user[data.name].castShadow = true;
				addPhysicsCube(user[data.name]);
				world.addBody(user[data.name].phisObj);
				scene.add(user[data.name].phisMesh);
				scene.add(user[data.name]);
				addText(data.name, user[data.name]);
			}
		});
		//sent when a user leaves
		socket.on('user left', function(name) {
			scene.remove(user[name]);
		});
		//sent to update the position of other players
		socket.on('position changed', function(data) {
			if (typeof user[data.name] != "undefined") {
				user[data.name].phisObj.position.fromArray(data.position);
				user[data.name].phisObj.quaternion.fromArray(data.qua);
			}
		});
	}
	//handles the sending of keys to the server
var buttonHandler = function(keyPressed, status) {
		if (keyPressed.target == $(".chat")) return;
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
		}
		if (keyPressed.shiftKey) {
			key.shift = true;
		} else {
			key.shift = false;
		}
	}
	//function that contains all logic for various things
var mainLoop = function() {
		if (key.w) user[userName].phisObj.applyImpulse(force.forward,user[userName].phisObj.position);
		if (key.s) user[userName].phisObj.applyImpulse(force.back,user[userName].phisObj.position);
		if (key.a) user[userName].phisObj.applyImpulse(force.left,user[userName].phisObj.position);
		if (key.d) user[userName].phisObj.applyImpulse(force.right,user[userName].phisObj.position);
		if (key.q) user[userName].rotation.y += 0.1;
		if (key.e) user[userName].rotation.y -= 0.1;
		if (key.space) user[userName].translateY(0.1);
		if (key.shift) user[userName].translateY(-0.1);

		if (key.w || key.a || key.s || key.d || key.q || key.e || key.space || key.shift) {
			socket.emit('keys pressed', key);
		} else if(userName.length > 0){
			user[userName].phisObj.angularVelocity.x *= 0.75;
			user[userName].phisObj.angularVelocity.y *= 0.75;
			user[userName].phisObj.angularVelocity.z *= 0.75;
		}
	}
	//handles the logic behind the submit button on the login screen
var submitHandler = function(e) {
		$('#name').off('keyup');
		registerEvents();
		registerChatSocket();
		if ($("#name").val().length > 0) {
			modelType = $(".model:checked").val();
			socket.emit('create user', {
				name: $("#name").val(),
				model: modelType
			});
			userName = $("#name").val();
			$('#login').hide();
			$('#main_window').show();
			chatHideDelay = $("#chatDelay").val();
			$(document).on('keydown', function(e) {
				buttonHandler(e, true);
			});
			$(document).on('keyup', function(e) {
				buttonHandler(e, false);
			});
			switch(modelType)
				{
					case "car":
						scene.add(camera);
						user[userName] = new THREE.Object3D();
						user[userName].model = new THREE.Mesh(carGeometry, carMaterial);
						user[userName].model.scale.set(0.6, 0.6, 0.6);
						user[userName].model.rotateX(-Math.PI / 2);
						user[userName].model.rotateZ(Math.PI);
						user[userName].updateMatrixWorld();
						user[userName].add(user[userName].model);
						THREE.SceneUtils.attach(camera, scene, user[userName]);
						break;
					case "person":
						user[userName] = new THREE.Mesh(blendMesh.geometry,blendMesh.material);
						user[userName].scale.set(0.01,0.01,0.01);
						scene.add(user[userName]);
						user[userName].add(camera);
						break;
					default:
						
						user[userName] = new THREE.Object3D();
						user[userName].model = new THREE.Mesh(cubeGeometry, clientMaterial);
						//user[userName].add(user[userName].model);
						user[userName].add(camera);
				}
			scene.add(user[userName]);
			addPhysicsCube(user[userName]);
			world.addBody(user[userName].phisObj);
			scene.add(user[userName].phisMesh);
			document.body.appendChild(renderer.domElement);
			if ($("#fpsShow").is(":checked")) {
				document.body.appendChild(stats.domElement);
			}
		} else {
			registerSubmitButton();
		}
	}
	//call to enable the submit button on the main page
var registerSubmitButton = function() {
		$("#sendName").one('click', submitHandler);
		$('#name').on('keyup', function(e) {
			if (e.keyCode == 13) {
				$('#sendName').trigger('click');
			}
		});
	}
	//run init
init();
//begin rendering
animate();
//toggles hiding/showing options pannel
$(function() {
	$("#server").val(defaultServer);
	$("#opts").on('click', function() {
		$("#options").toggle();
	});
});
//handle window changing size
function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
//register previous function
window.addEventListener('resize', onWindowResize, false);