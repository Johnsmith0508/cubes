/*global key CANNON registerChatSocket controls renderer user world gui*/
var sendUpdateNoKey = false;
var directonalForce = new CANNON.Vec3(0,0,0);
//call to enable the submit button on the main page
var registerSubmitButton = function() {
    $("#sendName").one('click', submitHandler);
    $('#name').on('keyup', function(e) {
      if (e.keyCode == 13) {
        $('#sendName').trigger('click');
      }
    });
  }
//handles the sending of keys to the server
var buttonHandler = function(keyPressed, status) {
    if (keyPressed.target == $(".chat")) return;
    switch (keyPressed.which) {
      case 87:
        key.w = status;
        break;
      case 83:
        key.s = status;
        break;
      case 65:
        key.a = status;
        break;
      case 68:
        key.d = status;
        break;
      case 81:
        key.q = status;
        break;
      case 69:
        key.e = status;
        break;
      case 32:
        key.space = status;
        break;
      case 84:
        key.t = status;
        break;
      case 82:
        controls.reset();
        break;
    }
    if (keyPressed.shiftKey) {
      key.shift = true;
    } else {
      key.shift = false;
    }
  }
//handles the logic behind the submit button on the login screen
var submitHandler = function(e) {
    $('#name').off('keyup');
    registerEvents();
    registerChatSocket();
    if ($("#name").val().length > 0) {
      modelType = $(".model:checked").val();
      socket.emit('create user', {
        name: $("#name").val(),
        model: modelType
      });
  }
}
  
 var preInit = function()
 {
   //console.log('preinit start');
  userName = $("#name").val();
  $('#login').hide();
  $('#main_window').show();
  chatHideDelay = $("#chatDelay").val();
  //addText("test",camera);
  $(document).on('keydown', function(e) {
    buttonHandler(e, true);
  });
  $(document).on('keyup', function(e) {
    buttonHandler(e, false);
  });
    user[userName] = new CapsuleColider(1,4);
    switch (modelType) {
      case "car":
        scene.add(camera);
        user[userName].model = new THREE.Mesh(carGeometry, carMaterial);
        user[userName].model.scale.set(0.6, 0.6, 0.6);
        user[userName].model.rotateX(-Math.PI / 2);
        user[userName].model.rotateZ(Math.PI);
        user[userName].updateMatrixWorld();
        user[userName].add(user[userName].model);
        THREE.SceneUtils.attach(camera, scene, user[userName]);
        break;
      case "person":
        user[userName] = new THREE.Mesh(blendMesh.geometry, blendMesh.material);
        user[userName].scale.set(0.01, 0.01, 0.01);
        scene.add(user[userName]);
        user[userName].add(camera);
        break;
      default:
        user[userName].add(camera);
    }
    scene.add(user[userName]);
    world.addBody(user[userName].phisObj);
    //scene.add(user[userName].phisMesh);
    var nameGuiElement = gui.addTextElement(userName,window.innerWidth / -2, window.innerHeight/2 - 20,{ textColor:"#262626" });
   
    nameGuiElement.position.x += nameGuiElement.scale.x / 2;
    document.body.appendChild(renderer.domElement);
    if ($("#fpsShow").is(":checked")) {
      document.body.appendChild(stats.domElement);
  } else {
    registerSubmitButton();
}
 }
//function that contains all logic for various things
var mainLoop = function() {
  key.angle = controls.getAzimuthalAngle();
  directonalForce.setZero();
  if(key.w) directonalForce.add(-Math.sin(key.angle),0,-Math.cos(key.angle));
  if(key.s) directonalForce.add(Math.sin(key.angle),0,Math.cos(key.angle));
  if(key.a) directonalForce.add(-Math.sin(key.angle + Math.PI/2),0,-Math.cos(key.angle + Math.PI/2));
  if(key.d) directonalForce.add(Math.sin(key.angle + Math.PI/2),0,Math.cos(key.angle + Math.P /2));
  if (key.space) directonalForce.add(0,0.25,0);
  if (key.shift) directonalForce.add(0,-0.25,0);
  directonalForce.normalize();
  //if (key.q) user[userName].rotation.y += 0.1;
  //if (key.e) user[userName].rotation.y -= 0.1;
  //if (key.space) user[userName].phisObj.applyImpulse(force.up, user[userName].phisObj.position);
  //if (key.shift) user[userName].phisObj.applyImpulse(force.down, user[userName].phisObj.position);
  
  if (key.w || key.a || key.s || key.d || key.q || key.e || key.space || key.shift) {
    user[userName].phisObj.applyImpulse(directonalForce, user[userName].phisObj.position);
    sendUpdateNoKey = true;
    socket.emit('keys pressed', key);
  } else if (userName.length > 0) {
    user[userName].phisObj.angularVelocity.x *= 0.75;
    user[userName].phisObj.angularVelocity.z *= 0.75;
    if (sendUpdateNoKey) {
      sendUpdateNoKey = false;
      socket.emit('keys pressed', key);
    }
  }
}