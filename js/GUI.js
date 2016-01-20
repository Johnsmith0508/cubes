/*global THREE */
if (typeof THREE === "undefined") throw "THREE.JS not found";

/** @namespace */
var GUI = {
	version: '0.0.1'
};
/**
center of the scene
*/
GUI.origin = new THREE.Vector3(0, 0, 0);
/**
@constructor
*/
GUI.guiScene = function() {
	/** the camera that is used
	@private */
	this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 1000);
	/** 
	the actual scene that is rendered
	@deprecated use {@link GUI.guiScene.addElement} instead
	*/
	this.scene = new THREE.Scene();
	this.scene.add(this.camera);
	this.camera.position.z = 50;
	this.camera.lookAt(GUI.origin);
	/**
	add an element to the gui
	@function
	@param {Object3D} object - object to add to the scene
	@returns {Object3D} the passed object
	*/
	this.addElement = function(object) {
		this.scene.add(object);
		return object;
	}
	/**
	render the scene
	@function
	@param {THREE.renderer} renderer - the THREE.js renderer that is used to render this
	*/
	this.render = function(renderer) {
		renderer.render(this.scene, this.camera);
	}
	/**
	add text to the gui
	@param {String} text - the text to be added
	@param {Int} x - x position (0,0 is center of screen)
	@param {Int} y - y position (0,0 is center of screen)
	@param {Object} [opts] - extra options to be passed
	@param {Int} [opts.z] - z-index of the object
	@returns {Object3D} the object that contains the text
	*/ 
	this.addTextElement = function(text, x, y, opts) {
		
		if(typeof opts === "undefined") opts = {};
		if(typeof opts.z === "undefined") opts.z = 0;
		if(typeof opts.textColor === "undefined") opts.textColor = "#000";
		
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
		canvasContext.fillStyle = opts.textColor;
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
		sprite.textWidth = textWidth;
		return sprite;
	}
}