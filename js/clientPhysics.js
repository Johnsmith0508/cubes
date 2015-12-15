var world, cube, body, ground, groundShape, groundMaterial;
var threeCube, cubeGeom, cubeMesh, planeMaterial, planeGeom, threePlane;


var force = {
	up : new CANNON.Vec3(0,1,0),
	down : new CANNON.Vec3(0,-1,0),
	left : new CANNON.Vec3(0,0,-1),
	right : new CANNON.Vec3(0,0,1),
	forward : new CANNON.Vec3(1,0,0),
	back : new CANNON.Vec3(-1,0,0),
	zero : new CANNON.Vec3(0,0,0)
}
var initCannon = function() {
	world = new CANNON.World();
	world.gravity.set(0, -3.81, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
	groundShape = new CANNON.Plane();
	ground = new CANNON.Body({
		mass: 0
	});
	ground.addShape(groundShape);
	ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
	ground.position.set(0, -5, 0);
	world.addBody(ground);
}

var initThree = function(scene) {
	cubeGeom = new THREE.SphereGeometry(1);
	cubeMesh = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});
	planeGeom = new THREE.PlaneGeometry(15, 15, 15, 15);
	planeMesh = new THREE.MeshBasicMaterial({
		color: 0xff00ff,
		wireframe: true
	});
	threePlane = new THREE.Mesh(planeGeom, planeMesh);

	scene.add(threePlane);
}

var upadtePhysics = function() {
	world.step(1 / 60);
	threePlane.position.copy(ground.position);
	threePlane.quaternion.copy(ground.quaternion);
	for(var i in user) {
		user[i].updatePhis();
	}
}

var addPhysicsCube = function(parent) {
	var box = new CANNON.Sphere(1);
	parent.phisObj = new CANNON.Body({mass:1});
	parent.phisObj.addShape(box);
	parent.reference = new THREE.Object3D();
	parent.phisMesh = new THREE.Mesh(cubeGeom,cubeMesh);
	
	parent.updatePhis = function() {
		this.position.copy(this.phisObj.position);
		this.phisMesh.position.copy(this.phisObj.position);
		this.phisMesh.quaternion.copy(this.phisObj.quaternion);
		this.model.quaternion.copy(this.phisObj.quaternion);
	}
}