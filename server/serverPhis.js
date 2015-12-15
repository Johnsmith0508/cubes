var CANNON = require('cannon');

var world, groundShape, ground;
exports.force = {
	up : new CANNON.Vec3(0,1,0),
	down : new CANNON.Vec3(0,-1,0),
	left : new CANNON.Vec3(0,0,-1),
	right : new CANNON.Vec3(0,0,1),
	forward : new CANNON.Vec3(1,0,0),
	back : new CANNON.Vec3(-1,0,0),
	zero : new CANNON.Vec3(0,0,0)
}

exports.initCannon = function() {
	exports.world = new CANNON.World();
	exports.world.gravity.set(0, -9.81, 0);
	exports.world.broadphase = new CANNON.NaiveBroadphase();
	exports.world.solver.iterations = 10;
	groundShape = new CANNON.Plane();
	ground = new CANNON.Body({
		mass: 0
	});
	ground.addShape(groundShape);
	ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
	ground.position.set(0, -5, 0);
	exports.world.addBody(ground);
}

exports.addPhisCube = function(parent) {
	var box = new CANNON.Sphere(1);
	parent.phisObj = new CANNON.Body({
		mass: 1
	});
	parent.phisObj.addShape(box);
	
	parent.updatePhis = function() {
		this.position.copy(this.phisObj.position);
		this.quaternion.copy(this.phisObj.quaternion);
	}
}

exports.updatePhysics = function(User) {
	exports.world.step(1 / 60);
	for (var i in User) {
		User[i].updatePhis();
	}
}