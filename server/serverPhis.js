var CANNON = require('cannon');

var world, groundShape, ground;

exports.initCannon = function() {
	world = new CANNON.World();
	world.gravity.set(0, -9.81, 0);
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

exports.addPhisCube = function(parent) {
	var box = new CANNON.Sphere(1);
	parent.phisObj = new CANNON.Body({
		mass: 1
	});
	parent.phisObj.addShape(box);
	
	parent.updatePhis = function() {
		//NOOP
	}
}

exports.updatePhysics = function(User) {
	world.step(1 / 60);
	for (var i in User) {
		User[i].position.copy(User[i].phisObj.position);
		User[i].quaternion.copy(User[i].phisObj.quaternion);
	}
}