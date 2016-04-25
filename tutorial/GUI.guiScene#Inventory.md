```javascript
var gui, inventory, renderer;
...
function init() {
  gui = new GUI.guiScene();
  inventory = new gui.Inventory(5,9);
  renderer = new THREE.WebGLRenderer({
		alpha: true
	});
}

function update(){
  requestAnimationFrame(update);
  gui.render(renderer);
  inventory.update();
}
...
init();
animate();
```
What it does
------------
the `init` function is a common staple of any `THREE.js` program, and is generaly used as the area to 'set up' anything that will be used for rendering.
In this example, we create a new gui scene (`new GUI.guiScene();`), then a new inventory based on it (`new gui.Inventory(5,9);`) that is 5 slots tall, by 9 wide.

If this code was pasted into a new file, noting would be seen. 
This is because the inventory is hidden by default<sup style="text-color:blue;">[Citation Needed]</sup>, so we must place a call to `inventory.show();` at the end of the init function to show the gui.