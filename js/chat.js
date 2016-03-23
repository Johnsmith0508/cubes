/**
@construtor
@param {socket} socket - socket.io connection to use
*/
var Chat = function(socket,keyCode,opts) {
  this.element = createElement("div").setClass("chat").createElement("ul",{id:"messages"}).createElement("input",{id:"msgIn"}).createElement("button",{id:"send"});
  this.chatOpen = false;
  $("#send").on('click', function(){
    this.chatOpen = false;
    if($("#msgIn").val().length > 0) {
      socket.emit('chat message',$("#msgIn").val());
      $("#msgIn").val('');
      $(".chat").hide();
    }
  });
  socket.on('chat message', function(payload){
  $('#messages').append($('<li>').text(payload));
  $(".chat").show();
  if(!this.chatOpen){
    setTimeout(function(){
    $(".chat").hide();
  },chatHideDelay*1000);}
  });
  $(document).on('keyup',function(e)
  {
    if(e.which === keyCode)
    {
      $(".chat").show();
      $("#msgIn").focus();
      hasChatOpen = true;
    }
    if(e.which === 13) {
      $("#send").trigger('click');
    }
  });
  return this.element;
}
