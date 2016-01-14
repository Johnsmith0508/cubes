/*global THREE*/
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
	sprite.position.y += 1.5;
	return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
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