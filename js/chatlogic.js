var hasChatOpen = false;
$(document.body).on('click','#send',function(){
  hasChatOpen = false;
  console.log("send button clicked");
  if($('#msgIn').val().length > 0){
    socket.emit('chat message', $('#msgIn').val());
    $('#msgIn').val('');
    $(".chat").hide();
  }
});
$('#msgIn').on('keyup',function(e)
{
if(e.keyCode == 13) {
  $('#send').trigger('click');
}
});
socket.on('chat message', function(payload){
  $('#messages').append($('<li>').text(payload.name + ': ' + payload.msg));
  $(".chat").show();
  if(!hasChatOpen){
    setTimeout(function(){
    $(".chat").hide();
  },5000);}
});

$(document).on('keyup',function(e)
{
  if(e.which == 84)
  {
    $(".chat").show();
    $("#msgIn").focus();
    hasChatOpen = true;
  }
  if(e.which == 13) {
    $("#send").trigger('click');
  }
});
