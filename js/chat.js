/**
@construtor
@param {socket} socket - socket.io connection to use
*/
var Chat = function(socket, keyCode, opts) {
  this.element = createElement("div").setClass("chat").createElement("ul", {
    id: "messages"
  }).createElement("input", {
    id: "msgIn"
  }).createElement("button", {
    id: "send"
  });
  this.chatOpen = false;
  var atBottom = true;
  $("#send").on('click', function() {
    this.chatOpen = false;
    if ($("#msgIn").val().length > 0) {
      socket.emit('chat message', $("#msgIn").val());
      $("#msgIn").val('');
      $(".chat").hide();
    }
  });
  socket.on('chat message', function(payload) {
    $(".chat").show();
    if (atBottom) {
      $('#messages').append($('<li>').text(payload));
      $("#messages").scrollTop($("#messages")[0].scrollHeight + 28);
    } else {
      $('#messages').append($('<li>').text(payload));
    }
    if (!this.chatOpen) {
      setTimeout(function() {
        $(".chat").hide();
      }, chatHideDelay * 1000);
    }
  });
  $("#messages").scroll(function() {
    console.log($("#messages").scrollTop() + $("#messages").innerHeight(), document.getElementById("messages").scrollHeight);
    setTimeout(function(){ console.log(document.getElementById("messages").scrollHeight);},1000);
    if ($("#messages").scrollTop() + $("#messages").innerHeight() == document.getElementById("messages").scrollHeight) {
      atBottom = true;
      console.log("atBottom");
    } else {
      atBottom = false;
    }
  });
  $(document).on('keyup', function(e) {
    if (e.which === keyCode) {
      $(".chat").show();
      $("#msgIn").focus();
      hasChatOpen = true;
    }
    if (e.which === 13) {
      $("#send").trigger('click');
    }
  });
  return this.element;
}