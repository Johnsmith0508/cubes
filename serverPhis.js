var CANNON = require('cannon');

var world,groundShape,ground;

var initCannon = function() {
  world = new CANNON.World();
  world.gravity.set(0,-9.81,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
  groundShape = new CANNON.Plane();
	ground = new CANNON.Body({mass:0});
	ground.addShape(groundShape);
	ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
	ground.position.set(0,-5,0);
	world.addBody(ground);
}