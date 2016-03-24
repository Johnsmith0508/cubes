/*global key CANNON registerChatSocket controls renderer user world gui $ */
var getCookies = function() {
  var c = document.cookie,
    v = 0,
    cookies = {};
  if (document.cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
    c = RegExp.$1;
    v = 1;
  }
  if (v === 0) {
    c.split(/[,;]/).map(function(cookie) {
      var parts = cookie.split(/=/, 2),
        name = decodeURIComponent(parts[0].trimLeft()),
        value = parts.length > 1 ? decodeURIComponent(parts[1].trimRight()) : null;
      cookies[name] = value;
    });
  } else {
    c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function($0, $1) {
      var name = $0,
        value = $1.charAt(0) === '"' ? $1.substr(1, -1).replace(/\\(.)/g, "$1") : $1;
      cookies[name] = value;
    });
  }
  return cookies;
}

var getCookie = function(name) {
  return getCookies()[name];
}

var roundRect = function(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

var addText = function(text, parentObject) {
  var canvas = document.createElement('canvas'),
    canvasContext = canvas.getContext('2d');
  canvas.style.border = '3px solid #000';
  canvas.style.borderRadius = '15px';
  canvas.height = 105;
  canvasContext.font = "100px Arial";
  var textWidth = canvasContext.measureText(text).width;
  canvas.width = textWidth;
  canvasContext.font = "normal 100px Arial";
  canvasContext.fillStyle = "#fff";
  roundRect(canvasContext, 1, 1, textWidth - 2, 100, 8);
  canvasContext.fillStyle = "#000";
  canvasContext.fillText(text, 0, 85);
  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  var material = new THREE.SpriteMaterial({
    map: texture
  });
  var sprite = new THREE.Sprite(material);
  sprite.scale.set(textWidth / 100, 1, 1);
  parentObject.add(sprite);
  sprite.position.z += 2.5;
  return sprite;
}

var loadJson = function(url) {
  $.ajaxSetup( { "async": false } );
  return $.getJSON(url).responseJSON;
}

var createElement = function(name,opts) {
  opts = opts || {};
  var element = document.createElement(name);
  element.createElement = function(name, opts){element.appendChild(createElement(name,opts));return element;}
  element.addElement = function(ele,opts){ opts = opts || {}; element.appendChild(ele); if(typeof opts.id !== "undefined"){ele.id = opts.id;} if(typeof opts.class !== "undefined"){ele.class = opts.class;} return element;}
  element.setId = function(id){element.id = id; return element;}
  element.setClass = function(c){element.class = c; return element;}
  element.id = (typeof opts.id !== "undefined") ? element.id = opts.id : null;
  element.class = (typeof opts.class !== "undefined") ? opts.class : null;
  return element;
}