var GUI = {version : '0.0.1'};
GUI.origin = new THREE.Vector3(0,0,0);
GUI.guiScene = function() {
	this.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );
  this.scene = new THREE.Scene();
  this.scene.add(this.camera);
	this.camera.position.z = 15;
	this.camera.lookAt(GUI.origin);
	
	this.addElement = function(object) {
		this.scene.add(object);
	}
	this.render = function(renderer) {
		renderer.render(this.scene,this.camera);
	}
}