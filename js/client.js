/*global $ THREE force initThree updatePhysics world CapsuleColider*/

/**
 * house keeping var; not used in code
 * @deprecated
 * @private
 */
var usedConsoleLogs = /^((?!\/\/).)*console\.log*/gi;
/**  renderer variable */
var scene,guiScene , camera, renderer, objMtlLoader, JsonLoader, gui;
/** app spesific variable */
var chatHideDelay, userName = "", isShifted,blendMesh,testsprite;
/** client model vars */
var testThing;
var cannonDebugRenderer;
var cubeGeometry, cubeMaterial, clientCubeMaterial;
var carGeometry, carMaterial,controls;
/** vars for enviroment */
var floorMaterial, wallsMaterial, light;
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
var sentUpdateNoKey = true;
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

	var test = new THREE.Mesh(cubeGeometry,cubeMaterial);
	//test.position;
	//gui.addElement(test);
	//testsprite = gui.addTextElement("hello", 50,250);
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
	
	cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world );
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
var registerEvents = function() {
	
		//called when a user joins the server
		socket.on('user joined', function(data) {
			if (typeof user[data.name] == "undefined" && typeof userName != "undefined") {
        //userName = data.name;
				//user[data.name] = new PhysicsSphere();
				user[data.name] = new CapsuleColider(1,4);
				user[data.name].position.fromArray(data.position);
				user[data.name].rotation.fromArray(data.rotation);
				world.addBody(user[data.name].phisObj);
				scene.add(user[data.name].phisMesh);
				scene.add(user[data.name]);
				user[data.name].addText(data.name);
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
	
	//GUI.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
//register previous function
window.addEventListener('resize', onWindowResize, false);