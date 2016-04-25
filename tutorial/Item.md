```javascript
var objLoader = new THREE.ObjLoader();
var itemOneModel;
jsonLoader.load('./demo.obj',function(data) {
  itemOneModel = data;
});

var itemOne = new Item("itemOne",itemOneModel);

var demoItemStack = new ItemStack(itemOne,1);
```
What it does
-----------
the first 5 lines of code simply create the 3D model for use later, and are not a part of this tutorial.
After that, we simply create an item named `itemOne` with our model, then create an itemstack with one item in it