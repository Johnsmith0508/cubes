/*global THREE */
if (typeof THREE === "undefined") throw "THREE.JS not found";

/** @namespace */
var GUI = {
	version: '1.0.1'
};
/**
center of the scene
*/
GUI.origin = new THREE.Vector3(0, 0, 0);
/**
default control scheme
*/
GUI.CONTROL_SCHEME_DEFAULT = {
	/*
	intended behavior:
		if user has item on mouse and none in the selected slot, place item in slot
		if user has no item on mouse and one in selected slot, pick up item
		if user has item on mouse and in selected slot, switch items. unless they are the same item, then combine
	*/
	leftClick: function(inventory, x, y) {
		var itemInSlot = typeof inventory.items[x][y] !== "undefined";
		var itemOnMouse = typeof inventory.mouseItem !== "undefined";
		if (itemOnMouse && !itemInSlot) {
			inventory.addItemToSlot(inventory.mouseItem, x, y);
			delete inventory.mouseItem;
		}
		if (itemInSlot && !itemOnMouse) {
			inventory.mouseItem = inventory.removeItem(x, y);
			delete inventory.items[x][y];
		}
		if (itemInSlot && itemOnMouse) {
			if(inventory.items[x][y].itemName == inventory.mouseItem.name) {
				inventory.items[x][y].ammount += inventory.mouseItem.ammount;
				delete inventory.mouseItem;
				return;
			}
			var standby = inventory.removeItem(x, y);
			inventory.addItemToSlot(inventory.mouseItem, x, y);
			inventory.mouseItem = standby;
		}
	},
	/*
	intended behavior:
		if user has item on mouse and none in slot, add one to slot; remove one from mouse
		if user has item no item on mouse and one in slot, remove half from the slot (floor num in slot, celing num on mouse)
		if user has item on mouse and item in hand, switch them. unless they are the same, then add one to slot & remove one from mouse
	*/
	rightClick: function(inventory, x, y) {
		var itemInSlot = typeof inventory.items[x][y] !== "undefined";
		var itemOnMouse = typeof inventory.mouseItem !== "undefined";
		if(itemOnMouse && !itemInSlot) {
			inventory.mouseItem.ammount--;
			var addedItem = inventory.mouseItem.clone();
			addedItem.ammount = 1;
			inventory.addItemToSlot(addedItem,x,y);
		}
		if(!itemOnMouse && itemInSlot) {
			var stackAmnt = inventory.items[x][y].ammount / 2;
			inventory.items[x][y].ammount = Math.floor(stackAmnt);
			inventory.mouseItem  = inventory.items[x][y].itemStack.clone();
			inventory.mouseItem.ammount = inventory.items[x][y].ammount;
			inventory.mouseItem.ammount = Math.ceil(stackAmnt);
		}
		if(itemInSlot && itemOnMouse) {
			if(inventory.items[x][y].itemName == inventory.mouseItem.name) {
				inventory.items[x][y].ammount++;
				inventory.mouseItem.ammount--;
				return;
			}
			var standby = inventory.removeItem(x, y);
			inventory.addItemToSlot(inventory.mouseItem, x, y);
			inventory.mouseItem = standby;
		}
	}
};
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
		@constructor
		@param {int} rows - number of rows in the gui
		@param {int} columns - number of columns in gui
		@param {object} [opts] - options
		@param {color} [opts.backgroundColor] - background UI color
		@param {color} [opts.lineColor] - color of lines in UI
		@param {object} [opts.ctrlScheme] - functions to be called when various buttons are clicked
		@memberof GUI
		@alias guiScene.Inventory
		*/
	this.Inventory = function(rows, columns, opts) {
		var invSelf = this;
		opts = opts || {};
		opts.backgroundColor = opts.backgroundColor || "#fff";
		opts.lineColor = opts.lineColor || "#000";
		this.ctrlScheme = opts.ctrlScheme || GUI.CONTROL_SCHEME_DEFAULT;
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
		this.grid.font = "30px Arial";
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
		this.grid.fillStyle = opts.lineColor;
		//document.body.appendChild(this.canvas);
		this.texture = new THREE.Texture(this.canvas);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.needsUpdate = true;
		this.material = new THREE.SpriteMaterial({
			map: this.texture
		});
		this.sprite = new THREE.Sprite(this.material);
		this.sprite.scale.set(this.width, this.height, 1);
		this.hidden = true;
		this.containerObject = new THREE.Object3D();
		this.containerObject.add(this.sprite);
		/**
		adds an item to the selected Slot
		@param {ItemStack} itemStack - Itemstack to add to the inv
		@param {int} x - column to place item in (0 is far left)
		@param {int} y - row to place item in (0 is top)
		@return {Array} coordinates that the item were added to
		*/
		this.addItemToSlot = function(itemStack, x, y) {
			this.items[x][y] = itemStack.model.clone();
			this.items[x][y].ammount = itemStack.ammount;
			this.items[x][y].oldAmt = itemStack.ammount;
			this.items[x][y].itemName = itemStack.name;
			this.items[x][y].itemStack = itemStack;
			var xPos = ((this.width / -2) + (x * 100) + 50);
			var yPos = ((this.height / 2) - (y * 100) - 50);
			this.items[x][y].position.set(xPos, yPos, 0);
			this.items[x][y].scale.multiplyScalar(50);
			this.containerObject.add(this.items[x][y]);
			return [x, y];
		}
		/**
		find the next empty slot in the inventory
		@return {Array} next empty slot
		*/
		this.getEmptySlot = function() {
			for(var j = 0; j < this.rows; j++){for(var i = 0; i < this.columns; i++){
				if(typeof this.items[i][j] === "undefined"){ return [i,j];}
			}}
		}
		/**
		add item to the next slot
		@param {ItemStack} itemStack - the ItemStack to be added
		*/
		this.addItemToEmptySlot = function(itemStack) {
			var pos = this.getEmptySlot();
			this.addItemToSlot(itemStack,pos[0],pos[1]);
		}
		/**
		removes item from slot
		@param {int} x - x-coord of slot to be removed from
		@param {int} y - y-coord of slot to be removed from
		@return {ItemStack} removed ItemStack
		*/
		this.removeItem = function(x, y) {
			if (typeof this.items[x][y] === "undefined") return false;
			this.containerObject.remove(this.items[x][y]);
			var ret = this.items[x][y].itemStack.clone();
			ret.ammount = this.items[x][y].ammount;
			this.grid.fillStyle = opts.backgroundColor;
			this.grid.fillText(this.items[x][y].oldAmt,x * 100 + 5, y * 100 + 30);
			delete this.items[x][y].ammount;
			
			return ret;
		}
		/**
		shows the Inventory
		*/
		this.show = function() {
			self.scene.add(this.containerObject);
			this.hidden = false;
		}
		/**
		hides the inventory
		*/
		this.hide = function() {
			self.scene.remove(this.containerObject);
			this.hidden = true;
		}
		/**
		toggles the inventory visiblity
		@return this
		*/
		this.toggle = function() {
			if (this.hidden) {
				this.show();
			} else {
				this.hide();
			}
			return this;
		}
		/**
		update function to be called every frame
		*/
		this.update = function() {
			for (var i = 0; i < this.items.length; i++) {
				for (var j = 0; j < this.items[i].length; j++) {
					if (typeof this.items[i][j] !== "undefined") {
						this.items[i][j].rotation.y += 0.05;
						this.grid.fillStyle = opts.backgroundColor;
						this.grid.fillText(this.items[i][j].oldAmt,i * 100 + 5, j * 100 + 30);
						this.grid.fillStyle = opts.lineColor;
						this.grid.fillText(this.items[i][j].ammount,i * 100 + 5, j * 100 + 30);
						this.items[i][j].oldAmt = this.items[i][j].ammount;
						
		this.texture.needsUpdate = true;
					}
				}
			}
		}
		/**
		find first occurence of item in inventory
		@param {string} itemName - name of item to find
		@return {Array} coordinates of first occurance of the item
		*/
		this.locateItem = function(itemName) {
			var ret = [];
			for(var i = 0; i < this.items.length; i++){ for(var j = 0; j < this.items[i].length; j++) {
				if(typeof this.items[i][j] !== "undefined" && this.items[i][j].itemName == itemName) {
					return [i,j];
				}
			}}
			return ret.length > 1 ? ret : ret[0];
		}
		window.addEventListener('mousedown', function(e) {
			var row = Math.floor((window.innerHeight / -2 + invSelf.height / 2 + e.clientY) / 100);
			var col =  Math.floor((window.innerWidth / -2 + invSelf.width / 2 + e.clientX) / 100);
			if (!invSelf.hidden &&  col <= invSelf.columns - 1 && row <= invSelf.rows - 1 && row >= 0 && col >= 0) {
				switch (e.button) {
					case 0:
						invSelf.ctrlScheme.leftClick(invSelf, col, row);
						break;
					case 2:
						invSelf.ctrlScheme.rightClick(invSelf, col, row);
						break;
				}
			}
		}, false);
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

/**
@constructor
@param {String} name - name of item
@param {THREE.Mesh} model - model to use for the item
@param {int} [id] - id of the item
@param {object} [functions] - functions that are bound to spesific events
@param {function} [functions.onUse] - callback when item is used
@param {function} [functions.onSecondary] - callback for second ability
@param {function} [functions.onHover] - callback for when cursor is over the item in the inventory (first are is true when mouse goes over, false when mouse leaves)
@param {Array} [lore] - flavor text to be displayed when hovering over an object in the inventory
@return - new Item
*/
var Item = function(name, model, id, functions, lore) {
	lore = lore || [];
	functions = functions || {};
	//there is something there
	if(lore.length > 0) {
		var maxLength = 0;
		this.loreCanvas = document.createElement("canvas");
		var ctx = this.loreCanvas.getContext("2d");
		ctx.font = "100px Arial";
		for(var i = 0; i < lore.length; i++) {
			if(ctx.measureText(lore[i]).width > maxLength) maxLength = ctx.measureText(lore[i]).width;
		}
		this.loreCanvas.height = lore.length * 105;
		this.loreCanvas.width = maxLength;
		ctx.fillStyle = "#fefefe";
		ctx.fillRect(0,0,maxLength,lore.length *105);
		ctx.fillStyle = "black";
		
		ctx.font = "100px Arial";
		for(var i = 0; i < lore.length; i++) {
			ctx.fillText(lore[i],0,(i + 1) * 100);
			ctx.stroke();
		}
		var texture = new THREE.Texture(this.loreCanvas);
		texture.needsUpdate = true;
		var loreMaterial = new THREE.SpriteMaterial({map:texture});
		this.lore = new THREE.Sprite(loreMaterial);
		this.lore.scale.set(maxLength / 7, lore.length * 15,1);
	}
	this._unclonedModel = model;
	this.model = model.clone();
	this.name = name;
	this.id = id || Math.floor(Math.random * 10000);
	this.onUse = functions.onUse || function() {};
	this.onSecondary = functions.onSecondary || function() {};
	this.clone = function() {
		return new Item(this.name, this.model, this.id, this.onUse, this.onSecondary);
	}
	this.use = function() {
		return functions.onUse();
	}
	this.secondary = function() {
		return functions.onSecondary();
	}
	this.hover = function() {
		return functions.onHover();
	}
	Item.allInstances.push(this);
	return this;
}
Item.allInstances = [];

/**
@constructor
@param {Item} item - what item the stack contains
@param {int} id - uuid of itemstack
@param {int} [ammount] - ammount of items in the stack
@return {ItemStack} - the new ItemStack
*/
var ItemStack = function(item, id, ammount) {
	this._unclonedItem = item;
	this.id = id;
	this.item = item;
	this.name = item.name;
	this.ammount = ammount || 1;
	this.model = this.item.model;
	this.addItem = function(num) {
		num = num || 1;
		this.ammount += num;
		return this;
	}
	this.removeItem = function(num) {
		num = num || 1;
		this.ammount -= num;
		return this;
	}
	this.use = function() {
		return this.item.use();
	}
	this.secondary = function() {
		return this.item.secondary();
	}
	this.getAmmount = function() {
		return this.ammount;
	}
	this.clone = function() {
		return new ItemStack(this._unclonedItem, this.ammount);
	}
	ItemStack.allInstances.push(this);
	return this;
}
ItemStack.allInstances = [];