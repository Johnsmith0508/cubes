/*global THREE CANNON*/
var world, body, ground, groundShape, groundMaterial;
var cubeGeom, cubeMesh, planeMaterial, planeGeom, threePlane;


var force = {
  up: new CANNON.Vec3(0, 1, 0),
  down: new CANNON.Vec3(0, -1, 0),
  left: new CANNON.Vec3(0, 0, -1),
  right: new CANNON.Vec3(0, 0, 1),
  forward: new CANNON.Vec3(1, 0, 0),
  back: new CANNON.Vec3(-1, 0, 0),
  zero: new CANNON.Vec3(0, 0, 0)
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
  testThing = new THREE.CubeGeometry(50, 50, 50);
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
  for (var i in user) {
    user[i].updatePhis();
  }
}

 var CapsuleColider = function(radius, height) {
   
   THREE.Object3D.call(this);
   
   this._topSphere = new CANNON.Sphere(radius);
   this._bottomSphere = new CANNON.Sphere(radius);
   this._cylinder = new CANNON.Cylinder(radius,radius,height - radius*2,16);
   this.phisObj = new CANNON.Body({ mass:1 });
   
   this.phisObj.addShape(this._cylinder);
   this.phisObj.addShape(this._topSphere,new CANNON.Vec3(0,0,height/2 - radius));
   this.phisObj.addShape(this._bottomSphere, new CANNON.Vec3(0,0,radius - height/2));
   this.phisObj.angularDamping = 1;
   this.phisObj.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
   console.log('2');
   this.ray = new CANNON.RaycastResult();
   this.updatePhis = function() {
     this.position.copy(this.phisObj.position);
     this.phisObj.position2 = this.phisObj.position.clone().add(0,-10,0);
     world.raycastAny(this.phisObj.position,this.phisObj.position2,{},this.ray);
     if(this.ray.distance < 3)
       {
         this.phisObj.position.y += 3 - this.ray.distance;
         this.phisObj.velocity.y = 0;
       }
    //this.phisMesh.position.copy(this.phisObj.position);
    //this.phisMesh.quaternion.copy(this.phisObj.quaternion);
    //this.model.quaternion.copy(this.phisObj.quaternion);
  }
   this.addText = function(text) {
    addText(text, this);
   }
 }
CapsuleColider.prototype = Object.create( THREE.Object3D.prototype );
CapsuleColider.prototype.constructor = CapsuleColider;

var PhysicsSphere = function() {

  //Protected Vars
  THREE.Object3D.call(this);
  this._sphere = new CANNON.Sphere(1);

  //Public Vars
  this.model = new THREE.Mesh(cubeGeometry, cubeMaterial);
  this.phisObj = new CANNON.Body({
    mass: 1
  });
  this.phisMesh = new THREE.Mesh(cubeGeom, cubeMesh);
  this.phisObj.addShape(this._sphere);
  //functions
  this.updatePhis = function() {
    this.position.copy(this.phisObj.position);
    this.phisMesh.position.copy(this.phisObj.position);
    this.phisMesh.quaternion.copy(this.phisObj.quaternion);
    this.model.quaternion.copy(this.phisObj.quaternion);
  }
  this.addText = function(text) {
    addText(text, this);
  }
}
PhysicsSphere.prototype = Object.create( THREE.Object3D.prototype );
PhysicsSphere.prototype.constructor = PhysicsSphere;

CANNON.Vec3.prototype.add = function(x,y,z) {
  this.x += x;
  this.y += y;
  this.z += z;
  return this;
}