//TEMPORARY CODE
var world,cube,body,ground,groundShape,groundMaterial;
var threeCube, cubeGeom, cubeMesh,planeMaterial, planeGeom, threePlane;
var initCannon = function() {
  world = new CANNON.World();
  world.gravity.set(0,-3.81,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
	groundShape = new CANNON.Plane();
	ground = new CANNON.Body({mass:0});
	ground.addShape(groundShape);
	ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
	ground.position.set(0,-5,0);
	world.addBody(ground);
	
  cube = new CANNON.Box(new CANNON.Vec3(1,1,1));
   body = new CANNON.Body({
            mass: 1
          });
          body.addShape(cube);
          body.angularVelocity.set(0,10,0);
          body.angularDamping = 0.5;
          world.addBody(body);

}

var initThree = function() {
  cubeGeom = new THREE.BoxGeometry(2,2,2);
  cubeMesh = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true } );
  threeCube = new THREE.Mesh(cubeGeom,cubeMesh);
 	
  scene.add(threeCube);
	
	planeGeom = new THREE.PlaneGeometry(15,15,15,15);
	planeMesh = new THREE.MeshBasicMaterial({color: 0xff00ff, wireframe: true});
	threePlane = new THREE.Mesh(planeGeom,planeMesh);
	
	scene.add(threePlane);
}

var upadtePhysics = function() {
  world.step(1/60);
  threeCube.position.copy(body.position);
  threeCube.quaternion.copy(body.quaternion);
	
	threePlane.position.copy(ground.position);
	threePlane.quaternion.copy(ground.quaternion);

}






//house keeping var; not used in code
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
//define renderer vars
var scene, camera, renderer, objMtlLoader, JsonLoader;
//define app spesific vars
var chatHideDelay, userName, isShifted;
//define client model vars
var cubeGeometry, cubeMaterial, clientCubeMaterial;
var carGeometry, carMaterial;
//define vars for enviroment
var floorMaterial, wallsMaterial, light;
//create socket.io connection to server
var socket /*= new io('//dynalogic.org', {
	path: '/node/socket.io'
})*/;
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
var addText = function(text, parentObject)
  {
		var canvas = document.createElement('canvas'),
				canvasContext = canvas.getContext('2d');
		canvas.style.border = '3px solid #000';
		canvas.style.borderRadius = '15px';
		canvas.height = 105;
		canvasContext.font = "100px Arial";
		var textWidth = canvasContext.measureText(text).width;
		canvas.width = textWidth;
		canvasContext.font = "normal 100px Arial";
		canvasContext.fillStyle = "#fff";
		roundRect(canvasContext, 1, 1, (textWidth - 2), 100, 8);
		canvasContext.fillStyle = "#000";
		canvasContext.fillText(text,0, 85);
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var material = new THREE.SpriteMaterial({
      map: texture
    });
    var sprite = new THREE.Sprite(material);
    //sprite.scale.set(textWidth / 10 * actualFontSize, actualFontSize, 1);\
		sprite.scale.set(textWidth / 100, 1, 1);
		parentObject.add(sprite);
		sprite.position.y += 1.5;
  }
	function roundRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
//initilise all required variables
function init() {
	//create three.js scene / init loaders
	scene = new THREE.Scene();
	JsonLoader = new THREE.JSONLoader();


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
	camera.lookAt(new THREE.Vector3(0,0,0));
	//init geometries
	planeGeom = new THREE.PlaneGeometry(30, 30);
	cubeGeometry = new THREE.BoxGeometry(2, 2, 2);

	//lights
	light = new THREE.PointLight(0xffffff, 1, 100);
	light.position.y = 15;
	light.position.z = 5;
	light.position.x = -7;
	scene.add(light);

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
	scene.add(plane);

	//load externals
	JsonLoader.load('/node/car.AnExtention', function(loadedCar) {
		carGeometry = loadedCar;
	});

	//temp
	//text = addText("hello",plane);
	//scene.add(text);
	initThree();
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
var registerEvents = function() {
//called when a user joins the server
socket.on('user joined', function(data) {
	//console.log(data.name + " joined");
	if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
		//console.log("creating object" + data.model + data.position.x);
		if (data.model == "car") {
			user[data.name] = new THREE.Object3D();
			user[data.name].model = new THREE.Mesh(carGeometry, carMaterial);
			user[data.name].model.rotateX(-Math.PI/2);
			user[data.name].model.rotateZ(Math.PI);
			user[data.name].model.scale.set(0.6,0.6,0.6);
			user[data.name].add(user[data.name].model);
		} else {
			user[data.name] = new THREE.Mesh(cubeGeometry, cubeMaterial);
			user[data.name].up.set(0,0,1);
		}
		user[data.name].position.fromArray(data.position);
		user[data.name].rotation.fromArray(data.rotation);
		user[data.name].castShadow = true;
		scene.add(user[data.name]);
		addText(data.name,user[data.name]);
	}
});
//sent when a user leaves
socket.on('user left',function(name)
{
	scene.remove(user[name]);
});
//sent to update the position of other players
socket.on('position changed', function(data) {
	//console.log(data.position);
	//console.log(data.name);
	if (typeof user[data.name] != "undefined") {
		user[data.name].position.fromArray(data.position);
		user[data.name].rotation.fromArray(data.rotation);
		//console.log('moved');
	}
});
//handles the sending of keys to the server
}
var buttonHandler = function(keyPressed, status) {
	if (keyPressed.target == $(".chat")) return;
	//console.log("key was pressed"+ keyPressed);
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
	//console.log(key.w);
	if (key.w) user[userName].translateX(0.1);
	if (key.s) user[userName].translateX(-0.1);
	if (key.a) user[userName].translateZ(-0.1);
	if (key.d) user[userName].translateZ(0.1);
	if (key.q) user[userName].rotation.y += 0.1;
	if (key.e) user[userName].rotation.y -= 0.1;
	if (key.space) user[userName].translateY(0.1);
	if (key.shift) user[userName].translateY(-0.1);

	if (key.w || key.a || key.s || key.d || key.q || key.q || key.e || key.space || key.shift) {
		//console.log("key(s) pressed");
		socket.emit('keys pressed', key);
	}
}
//handles the logic behind the submit button on the login screen
var submitHandler = function(e) {
	//console.log("submited");
	var path = $("#server").val().substring($("#server").val().indexOf("/",3),$("#server").val().length);
	var server = $("#server").val().substring(0,$("#server").val().indexOf("/",3));
	socket = new io(server,{path:path+"/socket.io"});
	$('#name').off('keyup');
	registerEvents();
	registerChatSocket();
	if ($("#name").val().length > 0) {
		socket = new io()
		modelType = $(".model:checked").val();
		socket.emit('create user', {
			name: $("#name").val(),
			model: modelType
		});
		userName = $("#name").val();
		//console.log("user name is " + userName);
		$('#login').hide();
		$('#main_window').show();
		chatHideDelay = $("#chatDelay").val();
		document.body.appendChild(renderer.domElement);
		if ($("#fpsShow").is(":checked")) {
			document.body.appendChild(stats.domElement);
		}
		$(document).on('keydown', function(e) {
			buttonHandler(e, true)
		});
		$(document).on('keyup', function(e) {
			buttonHandler(e, false)
		});
		if (modelType == "car") {
			scene.add(camera);
			user[userName] = new THREE.Object3D();
			user[userName].model = new THREE.Mesh(carGeometry, carMaterial);
			user[userName].model.scale.set(0.6, 0.6, 0.6);
			user[userName].model.rotateX(-Math.PI / 2);
			user[userName].model.rotateZ(Math.PI);
			user[userName].updateMatrixWorld();
			user[userName].add(user[userName].model);
			THREE.SceneUtils.attach(camera,scene,user[userName]);
		} else {
			user[userName] = new THREE.Mesh(cubeGeometry, clientMaterial);
		user[userName].add(camera);
		}
		scene.add(user[userName]);
		//console.log("registered key handlers");
		//$(document).on('keyup keydown',shiftHandler);
		//$(document).on('keypress',keypressHandler);
	} else {
		//console.log("name is empty");
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