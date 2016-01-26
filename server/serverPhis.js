var CANNON = require('cannon');
var  groundShape, ground;
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

exports.capsuleColider = function(radius,height,parent) {
	parent._topSphere = new CANNON.Sphere(radius);
	parent._bottomSphere = new CANNON.Sphere(radius);
	parent._cylinder = new CANNON.Cylinder(radius,radius,height- radius*2,16);
	parent.phisObj = new CANNON.Body({mass:1});
	parent.canJump = true;
	
	parent.phisObj.addShape(parent._cylinder);
	parent.phisObj.addShape(parent._topSphere,new CANNON.Vec3(0,0,height / 2 - radius));
	parent.phisObj.addShape(parent._bottomSphere,new CANNON.Vec3(0,0,radius - height / 2));
	parent.phisObj.angularDamping = 1;
  parent.phisObj.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
	parent.ray = new CANNON.RaycastResult();
	parent.updatePhis = function() {
		this.phisObj.position2 = this.phisObj.position.clone().add(0,-20,0);
		exports.world.raycastAny(this.phisObj.position,this.phisObj.position2,{},this.ray);
		//console.log(this.ray.distance);
		if(this.ray.distance < 3 && this.ray.distance != 1){
			this.phisObj.position.y += 3 - this.ray.distance;
			this.phisObj.velocity.y = 0;
			this.canJump = true;
		}
		this.position.copy(this.phisObj.position);
		this.quaternion.copy(this.phisObj.quaternion);
	}
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
		if(typeof User[i].updatePhis !== "undefined") {
			User[i].updatePhis();
				//console.log(typeof User[i].updatePhis);
		}
	}
}
CANNON.Vec3.prototype.add = function(x,y,z) {
	this.x += x;
	this.y += y;
	this.z += z;
	return this;
}