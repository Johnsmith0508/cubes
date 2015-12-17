exports.sendPhisUpdate = function(socket, name, position, velocity, quaternion) {
  exports.sendSyncPhisUpdate(socket.broadcast, name, position, velocity, quaternion);
}
exports.sendSyncPhisUpdate = function(io, name, position, velocity, quaternion) {
  io.emit('physics change', {
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