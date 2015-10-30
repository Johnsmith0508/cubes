$('#send').on('click',function(){
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
  setTimeout(function(){
    $(".chat").hide();
  },5000);
});

$(document).on('keyup',function(e)
{
  if(e.which == 84)
  {
    $(".chat").show();
    $("#sendName").focus();
  }
  if(e.which == 13) {
    $("#send").trigger('click');
  }
});