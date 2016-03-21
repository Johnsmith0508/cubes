var THREE = require('three.js');
var CANNON = require('cannon');
var functions = require('./functions.js');
exports.force = {
  up: new CANNON.Vec3(0, 1, 0),
  down: new CANNON.Vec3(0, -1, 0),
  left: new CANNON.Vec3(0, 0, -1),
  right: new CANNON.Vec3(0, 0, 1),
  forward: new CANNON.Vec3(1, 0, 0),
  back: new CANNON.Vec3(-1, 0, 0),
  zero: new CANNON.Vec3(0, 0, 0)
}

exports.initCannon = function() {
  exports.world = new CANNON.World();
  exports.world.gravity.set(0, -3.81, 0);
  exports.world.broadphase = new CANNON.NaiveBroadphase();
  exports.world.solver.iterations = 10;
  exports.groundShape = new CANNON.Plane();
  exports.ground = new CANNON.Body({
    mass: 0
  });
  exports.ground.addShape(exports.groundShape);
  exports.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  exports.ground.position.set(0, -5, 0);
  exports.world.addBody(exports.ground);
}

exports.initThree = function(scene) {
  exports.cubeGeom = new THREE.SphereGeometry(1);
  exports.testThing = new THREE.CubeGeometry(50, 50, 50);
  exports.cubeMesh = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  });
  exports.planeGeom = new THREE.PlaneGeometry(15, 15, 15, 15);
  exports.planeMesh = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    wireframe: true
  });
  exports.threePlane = new THREE.Mesh(planeGeom, planeMesh);

  scene.add(exports.threePlane);
}

exports.upadtePhysics = function(users) {
  exports.world.step(1 / 60);
  exports.threePlane.position.copy(ground.position);
  exports.threePlane.quaternion.copy(ground.quaternion);
  for (var i in users) {
    users[i].updatePhis();
  }
}

exports.CapsuleColider = function(radius, height, name) {

  THREE.Object3D.call(this);

  this._topSphere = new CANNON.Sphere(radius);
  this._bottomSphere = new CANNON.Sphere(radius);
  this._cylinder = new CANNON.Cylinder(radius, radius, height - radius * 2, 16);
  this.phisObj = new CANNON.Body({
    mass: 1
  });
  this.phisMesh = new THREE.Mesh(cubeGeom, cubeMesh);
  this._height = height;
  this.realPosition = new CANNON.Vec3(0,0,0);
  this.phisObj.addShape(this._cylinder);
  this.phisObj.addShape(this._topSphere, new CANNON.Vec3(0, 0, height / 2 - radius));
  this.phisObj.addShape(this._bottomSphere, new CANNON.Vec3(0, 0, radius - height / 2));
  this.phisObj.angularDamping = 1;
  this.phisObj.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  this.ray = new CANNON.RaycastResult();
  functions.addText(name, this.phisMesh);

  this.updatePhis = function() {
    this.position.copy(this.phisObj.position);
    this.phisObj.position2 = this.phisObj.position.clone().add(0, -20, 0);
    this.phisObj.bottomPosition = this.phisObj.position.clone().add(0, this._height / -2 - 0.1, 0);
    exports.world.raycastClosest(this.phisObj.bottomPosition, this.phisObj.position2, {}, this.ray);
    if (this.ray.distance < 1 && this.ray.distance != -1) {
      this.phisObj.position.y += 1 - this.ray.distance;
      this.phisObj.velocity.y = 0;
      if (name == userName) canJump = true;
    }
    this.phisMesh.position.copy(this.phisObj.position);
    this.phisMesh.quaternion.copy(this.phisObj.quaternion);
  }
  this.addText = function(text) {
    functions.addText(text, this);
  }
}
exports.CapsuleColider.prototype = Object.create(THREE.Object3D.prototype);
exports.CapsuleColider.prototype.constructor = exports.CapsuleColider;

CANNON.Vec3.prototype.add = function(x, y, z) {
  this.x += x;
  this.y += y;
  this.z += z;
  return this;
}
