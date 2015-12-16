exports.sendPhisUpdate = function(socket, name, position, velocity, quaternion) {
  socket.broadcast.emit('physics change', {
    name: name,
    position: {
      x: position[0],
      y: position[1],
      z: position[2]
    },
    velocity: {
      x: velocity[0],
      y: velocity[1],
      z: velocity[2]
    },
    quaternion: {
      x: quaternion[0],
      y: quaternion[1],
      z: quaternion[2],
      w: quaternion[3]
    }
  });
}

exports.chatCallback = function(message) {
  if (message.substring(0, 1) == "/") {
    if (message.substring(1, 10) == "debug_rot") {
      console.log(User[userName].rotation);
    }
    if (message.substring(1, 10) == "debug_pos") {
      console.log(User[userName].position);
      //return;
    }
    return;
  }
  console.log("(chat) " + userName + " : " + message);
  socket.broadcast.emit('chat message', userName + " : " + message);
  socket.emit('chat message', userName + " : " + message);
}