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
	var self = this;
	/** the camera that is used
	@private */
	this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 1000);
	this.light = new THREE.AmbientLight(0xffffff);
	/** 
	the actual scene that is rendered
	@deprecated use {@link GUI.guiScene.addElement} instead
	*/
	this.scene = new THREE.Scene();
	this.scene.add(this.camera);
	this.scene.add(this.light);
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

			if (typeof opts === "undefined") opts = {};
			if (typeof opts.z === "undefined") opts.z = 0;
			if (typeof opts.textColor === "undefined") opts.textColor = "#000";

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
			sprite.scale.set(textWidth / 4, 25, 25);
			sprite.position.set(x, y, opts.z);
			this.scene.add(sprite);
			//scene.add(sprite);
			sprite.position.y += 1.5;
			sprite.textWidth = textWidth;
			return sprite;
		}
		/**
		@construtor
		*/
	this.Inventory = function(rows, columns, opts) {
		var invSelf = this;
		opts = opts || {};
		opts.backgroundColor = opts.backgroundColor || "#fff";
		opts.lineColor = opts.lineColor || "#000";
		this.height = rows * 100 + 1;
		this.width = columns * 100 + 1;
		this.rows = rows;
		this.columns = columns;
		this.items = new Array(columns);
		for (var i = 0; i < this.items.length; i++) {
			this.items[i] = new Array(rows);
		}
		this.canvas = document.createElement("canvas");
		this.canvas.height = this.height;
		this.canvas.width = this.width;
		this.grid = this.canvas.getContext("2d");
		this.grid.beginPath();
		this.grid.rect(0, 0, this.width, this.height);
		this.grid.fillStyle = opts.backgroundColor;
		this.grid.fill();
		this.grid.lineWidth = 5;
		this.grid.strokeStyle = opts.lineColor;
		this.grid.moveTo(0, 0);
		this.grid.lineTo(0, this.height);
		this.grid.lineTo(this.width, this.height);
		this.grid.lineTo(this.width, 0);
		this.grid.lineTo(0, 0);
		this.grid.stroke();
		this.grid.lineWidth = 2;
		for (var i = 0; i <= this.width; i += 100) {
			this.grid.moveTo(i, 0);
			this.grid.lineTo(i, this.height);
		}
		for (var i = 0; i <= this.height; i += 100) {
			this.grid.moveTo(0, i);
			this.grid.lineTo(this.width, i);
		}
		this.grid.stroke();
		//document.body.appendChild(this.canvas);
		this.texture = new THREE.Texture(this.canvas);
		this.texture.needsUpdate = true;
		this.material = new THREE.SpriteMaterial({
			map: this.texture
		});
		this.sprite = new THREE.Sprite(this.material);
		this.sprite.scale.set(this.width /* (window.innerHeight / window.innerWidth)*/, this.height /* (window.innerHeight / window.innerWidth)*/, this.height);
		this.hidden = true;
		this.containerObject = new THREE.Object3D();
		//this.containerObject.scale.set(window.innerHeight / window.innerWidth * 5, window.innerHeight / window.innerWidth * 5, 1);
		this.containerObject.add(this.sprite);
		this.addItemStack = function(itemStack) {
				this.containerObject.add(itemStack.model);
			}
			/**
			@param {ItemStack} itemStack - Itemstack to add to the inv
			@param {int} x - column to place item in (0 is far left)
			@param {int} y - row to place item in (0 is top)
			*/
		this.addItemToSlot = function(itemStack, x, y) {
			this.items[x][y] = itemStack.model.clone();
			var xPos = ((this.width / -2) + (x * 100) + 50) /* (window.innerHeight / window.innerWidth)*/;
			var yPos = ((this.height / 2) - (y * 100) - 50) /* (window.innerHeight / window.innerWidth)*/;
			this.items[x][y].position.set(xPos, yPos, 0);
			this.items[x][y].scale.multiplyScalar(50);
			this.containerObject.add(this.items[x][y]);
		}
		this.show = function() {
			self.scene.add(this.containerObject);
			this.hidden = false;
		}
		this.hide = function() {
			self.scene.remove(this.containerObject);
			this.hidden = true;
		}
		this.toggle = function() {
			if (this.hidden) {
				this.show();
			} else {
				this.hide();
			}
			return this;
		}
		this.update = function() {
			for(var i = 0; i < this.items.length; i++) {
				for(var j = 0; j < this.items[i].length; j++) {
					if(typeof this.items[i][j] !== "undefined")
						{
							this.items[i][j].rotation.y += 0.05;
						}
				}
			}
		}
		window.addEventListener('resize', function() {
			//invSelf.containerObject.scale.set(3 * window.innerHeight / window.innerWidth, 3 * window.innerHeight / window.innerWidth, 1);
			//invSelf.sprite.scale.set(invSelf.width * (window.innerHeight / window.innerWidth), invSelf.height * (window.innerHeight / window.innerWidth), invSelf.height);
			//console.info(invSelf.containerObject.scale);
		}, false);
		return this;
	}
	window.addEventListener('resize', function() {
		self.camera.left = window.innerWidth / -2;
		self.camera.right = window.innerWidth / 2;
		self.camera.top = window.innerHeight / 2;
		self.camera.bottom = window.innerHeight / -2;
		self.camera.updateProjectionMatrix();
	}, false);
}