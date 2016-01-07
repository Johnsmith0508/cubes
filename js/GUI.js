if (typeof THREE === "undefined") throw "THREE.JS not found"
var GUI = {
	version: '0.0.1'
};
GUI.origin = new THREE.Vector3(0, 0, 0);
GUI.guiScene = function() {
	this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 1000);
	this.scene = new THREE.Scene();
	this.scene.add(this.camera);
	this.camera.position.z = 50;
	this.camera.lookAt(GUI.origin);

	this.addElement = function(object) {
		this.scene.add(object);
	}
	this.render = function(renderer) {
		renderer.render(this.scene, this.camera);
	}
	this.addTextElement = function(text, x, y, opts) {
		
		if(typeof opts === "undefined") opts = {};
		if(typeof opts.z === "undefined") opts.z = 0;
		
		var canvas = document.createElement('canvas'),
		canvasContext = canvas.getContext('2d');
		canvas.style.border = '3px solid #000';
		canvas.style.borderRadius = '15px';
		canvas.height = 105;
		canvasContext.font = "100px Arial";
		var textWidth = canvasContext.measureText(text).width;
		canvas.width = textWidth;
		canvasContext.font = "normal 100px Arial";
		//canvasContext.fillStyle = "#f06";
		//roundRect(canvasContext, 1, 1, (textWidth - 2), 100, 8);
		canvasContext.fillStyle = "#000";
		canvasContext.fillText(text, 0, 85);
		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;
		var material = new THREE.SpriteMaterial({
			map: texture
		});
		var sprite = new THREE.Sprite(material);
		sprite.scale.set(textWidth / 4, 25,25);
		sprite.position.set(x,y,opts.z);
		this.scene.add(sprite);
		//scene.add(sprite);
		sprite.position.y += 1.5;
		return sprite;
	}
}