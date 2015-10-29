var scene, camera, renderer, container;
var geometry, material, clientMaterial, mesh, planeGeom, planeMaterial;
var socket = new io();
var key = {};
var height = 7;
var size = 3;
var userName;
var isShifted;
var user = {};
var usernamePlates = {};

function init()
{
    //container = document.getElementById('threeJsRenderWindow');
    //document.body.appendChild(container);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  //camera.position.z = -1000;
  camera.position.y = 1000;
  camera.position.x = -1000;
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  planeGeom = new THREE.PlaneGeometry(3000,3000);
  geometry = new THREE.BoxGeometry(200, 200, 200);

  planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x9966ff,
    side: THREE.DoubleSide
  });
  material = new THREE.MeshBasicMaterial({
    color: 0xffa000,
    wireframe: false
  });
  clientMaterial = new THREE.MeshBasicMaterial({
    color: 0x003366,
    wireframe: false
  });
  plane = new THREE.Mesh(planeGeom,planeMaterial);
  scene.add(plane);
  plane.rotation.x = (Math.PI / 2);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  registerSubmitButton();
}

function animate()
{

  requestAnimationFrame(animate);

  //mesh.rotation.x += 0.01;
  //mesh.rotation.y += 0.02;

  renderer.render(scene, camera);

}


socket.on('move', function(info)
{
  //console.log(info);
  if (typeof user[info.name] == "undefined") {
    if (info.name == userName) {
      user[info.name] = new THREE.Mesh(geometry, clientMaterial);
      user[userName].add(camera);
    } else {
      user[info.name] = new THREE.Mesh(geometry, material);
      createTextAtPosition(info.name, user[info.name]);
    }
    scene.add(user[info.name]);

  }
  user[info.name].position.x = info.posX;
  user[info.name].position.y = info.posY;
  user[info.name].position.z = info.posZ;

  user[info.name].rotation.x = info.rotX;
  user[info.name].rotation.y = info.rotY;
  user[info.name].rotation.z = info.rotZ;
  //user[userName].material.color = 0xffb000;
});


function createTextAtPosition(text, parentObj)
{
  var name = new THREE.TextGeometry(text, {
    size: 70,
    height: 20,
    curveSegments: 4,
    font: "helvetiker", //TODO: finish this http://threejs.org/examples/webgl_geometry_text.html
    weight: "normal",
    style: "normal",
    bevelEnabled: false,
    material: 0,
    extrudeMaterial: 1
  });
  name.computeBoundingBox();
  name.computeVertexNormals();

  var triangleAreaHeuristics = 0.1 * (height * size);

  for (var i = 0; i < name.faces.length; i++) {

    var face = name.faces[i];

    if (face.materialIndex == 1) {

      for (var j = 0; j < face.vertexNormals.length; j++) {

        face.vertexNormals[j].z = 0;
        face.vertexNormals[j].normalize();

      }

      var va = name.vertices[face.a];
      var vb = name.vertices[face.b];
      var vc = name.vertices[face.c];

      var s = THREE.GeometryUtils.triangleArea(va, vb, vc);

      if (s > triangleAreaHeuristics) {

        for (var z = 0; z < face.vertexNormals.length; j++) {

          face.vertexNormals[z].copy(face.normal);

        }

      }

    }

  }
  var centerOffset = -0.5 * (name.boundingBox.max.x - name.boundingBox.min.x);

  textMesh1 = new THREE.Mesh(name, material);

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = 200;
  textMesh1.position.z = 0;

  textMesh1.rotation.x = 0;
  textMesh1.rotation.y = Math.PI / 2;

  parentObj.add(textMesh1);


}

var buttonHandler = function(keyPressed,status)
{
  key.numPressed = (status ? key.numPressed +1 : key.numPressed -1);
  switch (keyPressed)
  {
    case 119:
      key.w = status;
      break;
    case 115:
      key.s = status;
      break;
    case 97:
      key.a = status;
      break;
    case 100:
      key.d = status;
      break;
    case 113:
      key.q = status;
      break;
    case 101:
      key.e = status;
      break;
    case 32:
      key.space = status;
      break;
  }
}
var mainLoop = function()
{
  console.log(key.w);
  if(key.w) user[userName].translateX(10);
  if(key.s) user[userName].translateX(-10);
  if(key.a) user[userName].translateZ(-10);
  if(key.d) user[userName].translateZ(10);
  if(key.q) socket.emit('keypress','q');
  if(key.e) socket.emit('keypress','e');
  if(key.numPressed > 0) socket.emit('translate', {
    posX: user[userName].position.x,
    posY: user[userName].position.y,
    posZ: user[userName].position.z
  });
}
var shiftHandler = function(e)
{
    if (e.shiftKey) {
      user[userName].translateY(-10);
      socket.emit('translate', {
        posX: user[userName].position.x,
        posY: user[userName].position.y,
        posZ: user[userName].position.z
      });
    }
}

var submitHandler = function(e)
{
	//console.log("submited");
  if ($("#name").val().length > 0)
  {
      $('#login').hide();
      $('#main_window').show();
      document.body.appendChild(renderer.domElement);
    socket.emit('user', $("#name").val());
    userName = $("#name").val();
    $(document).on('keydown', function (e) { buttonHandler(e, true) });
    $(document).on('keyup', function (e) { buttonHandler(e, false) });
      //$(document).on('keyup keydown',shiftHandler);
    //$(document).on('keypress',keypressHandler);
  } else
  {
    //console.log("name is empty");
    registerSubmitButton();
  }
}

var registerSubmitButton = function()
{
	//console.log("reg sub");
    $("#sendName").one('click', submitHandler);
    $('#name').one('keyup', function (e) {
        if(e.keyCode == 13)
        {
            $('#sendName').trigger('click');
        }
    });
}

init();
animate();
var loop = setInterval(mainLoop,1000/60);
