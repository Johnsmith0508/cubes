//house keeping var; not used in code
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
//define renderer vars
var scene,guiScene , camera, renderer, objMtlLoader, JsonLoader, gui;
//define app spesific vars
var chatHideDelay, userName = "", isShifted,blendMesh;
//define client model vars
var testThing;
var cubeGeometry, cubeMaterial, clientCubeMaterial;
var carGeometry, carMaterial,controls;
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
	keyPressed: 0,
	angle: 0
};
//object of all users
var user = {};
//so the server is only told about no keys being pressed once
var sentUpdateNoKey = true;
//initilise all required variables
function init() {
	//create three.js scene / init loaders
	scene = new THREE.Scene();
	JsonLoader = new THREE.JSONLoader();
	blendMesh = new THREE.BlendCharacter();
	gui = new GUI.guiScene();
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
	plane.rotation.x = (Math.PI / 2);
	plane.reciveShadow = true;
	//scene.add(plane);

	var test = new THREE.Mesh(cubeGeometry,cubeMaterial);
	//test.position;
	gui.addElement(test);
	//load externals
	JsonLoader.load('/node/model/car.AnExtention', function(loadedCar) {
		carGeometry = loadedCar;
	});
	blendMesh.load('model/marine_anims.js',function(){
		blendMesh.scale.set(0.01,0.01,0.01);
		//guiScene.add(blendMesh);
	});
	
	initThree(scene);
	initCannon();
	//init renderer
	renderer = new THREE.WebGLRenderer({alpha:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	//controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enablePan = false;
	registerSubmitButton();

}
//called every frame
function animate() {
	stats.begin();
	mainLoop();
	upadtePhysics();
	controls.update();
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
var registerEvents = function() {
		//called when a user joins the server
		socket.on('user joined', function(data) {
			if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
        userName = data.name;
				user[data.name] = new PhysicsSphere();
				user[data.name].position.fromArray(data.position);
				user[data.name].rotation.fromArray(data.rotation);
				world.addBody(user[data.name].phisObj);
				scene.add(user[data.name].phisMesh);
				scene.add(user[data.name]);
				user[userName].addText(data.name);
			}
		});
		//sent when a user leaves
		socket.on('user left', function(name) {
			//console.log(name);
			scene.remove(user[name]);
			scene.remove(user[name].phisMesh);
			world.removeBody(user[name].phisObj);
		});
		//meh
		socket.on('physics change',function(data){
			if(typeof user[userName] !== "undefined"){
				//console.log(data);
				user[data.name].phisObj.position.set(data.position.x,data.position.y,data.position.z);
				user[data.name].phisObj.velocity.set(data.velocity.x,data.velocity.y,data.velocity.z);
				user[data.name].phisObj.quaternion.set(data.quaternion.x,data.quaternion.y,data.quaternion.z,data.quaternion.w);
			}
		});
		socket.on('error',function(error){
			if(error == "user exists")
				{
					$("#ErrorMsg").val("Username is in use, Try annother");
					$("#ErrorMsg").show();
					registerSubmitButton();
				}
		});
		socket.on('user created',function(){
			//console.log('meh');
			preInit();
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
var sendUpdateNoKey = false;
var directonalForce = new CANNON.Vec3(0,0,0);
//call to enable the submit button on the main page
var registerSubmitButton = function() {
    $("#sendName").one('click', submitHandler);
    $('#name').on('keyup', function(e) {
      if (e.keyCode == 13) {
        $('#sendName').trigger('click');
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
  }
}
  
 var preInit = function()
 {
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
    user[userName] = new PhysicsSphere();
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
    scene.add(user[userName].phisMesh);
    document.body.appendChild(renderer.domElement);
    if ($("#fpsShow").is(":checked")) {
      document.body.appendChild(stats.domElement);
  } else {
    registerSubmitButton();
}
 }
//function that contains all logic for various things
var mainLoop = function() {
  key.angle = controls.getAzimuthalAngle();
  if((key.w && key.d) || (key.s && key.a)) key.angle -= (Math.PI / 4);
  if((key.w && key.a) || (key.s && key.d)) key.angle += (Math.PI / 4);
  if (key.w) directonalForce.set(-Math.sin(key.angle),0,-Math.cos(key.angle));
  if (key.s) directonalForce.set(Math.sin(key.angle),0,Math.cos(key.angle));
  if (key.a && !(key.w || key.s)) directonalForce.set(-Math.sin(key.angle + (Math.PI / 2)),0,-Math.cos(key.angle + (Math.PI / 2)));
  if (key.d && !(key.w || key.s)) directonalForce.set(Math.sin(key.angle + (Math.PI / 2)),0,Math.cos(key.angle + (Math.PI / 2)));
  if (key.q || key.e || key.space || key.shift || (key.w && key.s) || (key.a && key.d)) directonalForce.set(0,0,0);

  //if (key.q) user[userName].rotation.y += 0.1;
  //if (key.e) user[userName].rotation.y -= 0.1;
  if (key.space) user[userName].phisObj.applyImpulse(force.up, user[userName].phisObj.position);
  if (key.shift) user[userName].phisObj.applyImpulse(force.down, user[userName].phisObj.position);
  
  if (key.w || key.a || key.s || key.d || key.q || key.e || key.space || key.shift) {
    user[userName].phisObj.applyImpulse(directonalForce, user[userName].phisObj.position);
    sendUpdateNoKey = true;
    socket.emit('keys pressed', key);
  } else if (userName.length > 0) {
    user[userName].phisObj.angularVelocity.x *= 0.75;
    user[userName].phisObj.angularVelocity.z *= 0.75;
    if (sendUpdateNoKey) {
      sendUpdateNoKey = false;
      socket.emit('keys pressed', key);
    }
  }
}