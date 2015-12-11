var socket = new id("//dynalogic.org", {
	path: '/node/socket.io'
});

socket.emit('create user',{name:"map"});
socket.on('user joined',function(){
  
});