/**
* Server
*/
io.on('connection',function(/*name, model*/){
  //create user object
  //tell others about new user
  //tell user about others
});
io.on('moved',function(/*array of buttons pushed*/){
  //translate accordingly
  //rotate accordingly
  //send new position to all clients
});
io.on('chat',function(/*message*/){
  //do the thing
}); 


/**
* Client
*/

on('keypress',function(/*button pressed*/){
  //set key to true
});

on('conneted');

/*main loop*/
{
  if(/*any key was pressed is*/true)
    {
      var arrayOfKeysPressed/* = keys pressed that are true*/;
      socket.emit('somthing about keys',{
        keys:meh/*that array*/
      });
    }
}