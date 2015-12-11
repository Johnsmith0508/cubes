var world, cube, body, ground, groundShape, groundMaterial;
var threeCube, cubeGeom, cubeMesh, planeMaterial, planeGeom, threePlane;
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

	cube = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
	body = new CANNON.Body({
		mass: 1
	});
	body.addShape(cube);
	body.angularVelocity.set(0, 10, 0);
	body.angularDamping = 0.5;
	world.addBody(body);

}

var initThree = function(scene) {
	cubeGeom = new THREE.BoxGeometry(2, 2, 2);
	cubeMesh = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		wireframe: true
	});
	threeCube = new THREE.Mesh(cubeGeom, cubeMesh);

	scene.add(threeCube);

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
	threeCube.position.copy(body.position);
	threeCube.quaternion.copy(body.quaternion);

	threePlane.position.copy(ground.position);
	threePlane.quaternion.copy(ground.quaternion);

}