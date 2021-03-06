/*global $ */
var hasChatOpen = false;
$(document.body).on('click','#send',function(){
  hasChatOpen = false;
  if($('#msgIn').val().length > 0){
    socket.emit('chat message', $('#msgIn').val());
    $('#msgIn').val('');
    $(".chat").hide();
  }
});
$('#msgIn').on('keyup',function(e)
{
if(e.keyCode === 13) {
  $('#send').trigger('click');
}
});
var registerChatSocket = function(){
socket.on('chat message', function(payload){
  $('#messages').append($('<li>').text(payload));
  $(".chat").show();
  if(!hasChatOpen){
    setTimeout(function(){
    $(".chat").hide();
  },chatHideDelay*1000);}
});
}
$(document).on('keyup',function(e)
{
  if(e.which === keycode.chat)
  {
    $(".chat").show();
    $("#msgIn").focus();
    hasChatOpen = true;
  }
  if(e.which === 13) {
    $("#send").trigger('click');
  }
});
