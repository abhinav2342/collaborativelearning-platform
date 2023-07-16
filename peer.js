<div>
  <div class="row">
    <div class="col-md-8">
      <textarea id="code-screen">{{content}}</textarea>
    </div>
    <div class="col-md-4" id="chatbox">
      <div class="panel panel-primary">
        <!-- VIDEO CALL -->
        <div id="video-container">
          <video autoplay id="second-video"></video>
          <video autoplay id="my-video" muted="true"></video>
          <div id="step2">
            <p>Your ID: <span id="my-id">...</span></p>
            <div class="form-inline">
              <input type="text" class="form-control" placeholder="Call User ID..." id="callto-id">
              <a href="#" class="btn btn-sm btn-success" id="make-call">Call</a>
            </div>
          </div>
          <div id="step3">
            <p>Talk to <span id="second-id">...</span>
              <a href="#" class="btn btn-sm btn-danger" id="end-call">End call</a>
            </p>
          </div>
        </div>

        <!-- CHAT ROOM -->
        <div class="panel-heading">
          CHAT ROOM
          <span class="pull-right" id="chatbox-username">
            {{#if user}}
              {{user.name}}
            {{/if}}
          </span>
        </div>
        <div class="panel-body">
          <ul class="media-list" style="heigh: 300px; overflow-y: scroll" id="chatbox-listMessages">

          </ul>
        </div>
        <div class="panel-footer">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="Enter message" id="userMessage"/>
            <span class="input-group-btn">
              <button type="button" class="btn btn-primary" onclick="sendMessage()">SEND</button>
            </span>
          </div>
        </div>
      </div>



    </div>
  </div>
</div>
<input type="hidden" value="{{roomId}}" id="roomId"/>

<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.25.0/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.25.0/mode/javascript/javascript.min.js"></script>

<script src="/plugins/ot/ot.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script src="/plugins/peerjs/peerjs.min.js"></script>

<script>
  var EditorClient = ot.EditorClient;
  var SocketIOAdapter = ot.SocketIOAdapter;
  var CodeMirrorAdapter = ot.CodeMirrorAdapter;

  var socket = io.connect('http://localhost:3000');
  var editor = CodeMirror.fromTextArea(document.getElementById("code-screen"), {
    lineNumbers: true,
    theme: "monokai"
  });

  var code = $('#code-screen').val();
  var cmClient;
  function init(str, revision, clients, serverAdapter) {
    if (!code) {
      editor.setValue(str);
    }

    cmClient = window.cmClient = new EditorClient(
      revision, clients, serverAdapter, new CodeMirrorAdapter(editor)
    );
  };

  socket.on('doc', function(obj) {
    init(obj.str, obj.revision, obj.clients, new SocketIOAdapter(socket));
  });

  var username = $("#chatbox-username").val();
  if(username === "") {
    var userId = Math.floor(Math.random() * 9999).toString();
    username = "User" + userId;
    $("#chatbox-username").text(username);
  };

  var roomId = $('#roomId').val();
  socket.emit('joinRoom', {room: roomId, username: username});

  var userMessage = function(name, text) {
    return ('<li class="media"> <div class="media-body"> <div class="media">' +
      '<div class="media-body"' +
      '<b>' + name + '</b> : ' + text +
      '<hr/> </div></div></div></li>'
    );
  };

  var sendMessage = function() {
    var userMessage = $('#userMessage').val();
    socket.emit('chatMessage', {message: userMessage, username: username});
    $('#userMessage').val("");
  };

  socket.on('chatMessage', function(data) {
    $('#chatbox-listMessages').append(userMessage(data.username, data.message));
  });

  // PeerJS
  // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    // PeerJS object
    var peer = new Peer(undefined,{
      host:'/',
      port: '3001'
    });
    
    
    peer.on('open', id => { // When we first open the app, have us join a room
    socket.emit('join-room', ROOM_ID, id)
    })


    peer.on('open', function(){
      $('#my-id').text(peer.id);
    });

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      call.answer(window.localStream);
      step3(call);
    });

    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
    });

    // Click handlers setup
    $(function(){
      $('#make-call').click(function(){
        // Initiate a call!
        //var call = peer.call($('#callto-id').val(), window.localStream);
        var call = peer.call()
        step3(call);
      });
      $('#end-call').click(function(){
        window.existingCall.close();
        step2();
      });
      step1();
    });
    function step1 () {
      // Get audio/video stream
      navigator.getUserMedia({audio: true, video: true}, function(stream){
        // Set your video displays
        let video=document.getElementById("my-video");
        video.srcObject=stream;
        
        window.localStream = stream;
        step2();
      }, function(){ $('#step1-error').show(); });
    }

    function step2 () {
      $('#step1, #step3').hide();
      $('#step2').show();
    }

    function step3 (call) {
      // Hang up on an existing call if present
      if (window.existingCall) {
        window.existingCall.close();
      }
      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        let video=document.getElementById("second-video");
        video.srcObject=stream;
      });
      // UI stuff
      window.existingCall = call;
      $('#second-id').text(call.peer);
      call.on('close', step2);
      $('#step1, #step2').hide();
      $('#step3').show();
    }

</script>
