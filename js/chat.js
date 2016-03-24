/**
@construtor
@param {socket} socket - socket.io connection to use
*/
var Chat = function(socket, keyCode, opts) {
  opts = opts || {};
  opts.hideDelay = opts.hideDelay || 5;
  var timeout;
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
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        $(".chat").hide();
      }, opts.hideDelay * 1000);
    }
  });
  $("#messages").scroll(function() {
    if ($("#messages").scrollTop() + $("#messages").innerHeight() == document.getElementById("messages").scrollHeight) {
      atBottom = true;
    } else {
      atBottom = false;
    }
  });
  $(document).on('keyup', function(e) {
    if (e.which === keyCode) {
      $(".chat").show();
      $("#msgIn").focus();
      clearTimeout(timeout);
      hasChatOpen = true;
    }
    if (e.which === 13) {
      $("#send").trigger('click');
    }
    if (typeof opts.closeKey !== "undefined") {
      if (e.which === opts.closeKey) {
        $(".chat").hide();
      }
    }
  });
  return this.element;
}