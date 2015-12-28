//house keeping var; not used in code
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
//define renderer vars
var scene, camera, renderer, objMtlLoader, JsonLoader;
//define app spesific vars
var chatHideDelay, userName = "", isShifted,blendMesh;
//define client model vars
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