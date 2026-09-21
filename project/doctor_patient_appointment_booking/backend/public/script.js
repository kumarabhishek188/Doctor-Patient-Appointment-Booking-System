const socket = io("/");
const videoGrid = document.getElementById("videoGrid");
const noRemoteMsg = document.getElementById("noRemoteMsg");
const callRequest = document.getElementById("callRequest");
const callRequestTitle = document.getElementById("callRequestTitle");
const callRequestText = document.getElementById("callRequestText");
const acceptCallBtn = document.getElementById("acceptCall");
const rejectCallBtn = document.getElementById("rejectCall");
const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.setAttribute("data-label", "You");

let audiotoggle = true;
let videotoggle = true;

const peers = {};
const remoteVideos = {};
let stream;
let pendingCallerId = null;
let callAccepted = false;
const roomStatusKey = `video-room:${ROOM_ID}`;

function setRoomStatus(status, detail = '') {
    localStorage.setItem(roomStatusKey, JSON.stringify({ status, detail, role: USER_ROLE, updatedAt: Date.now() }));
}

function updateMyLabel() {
    const label = myVideo.parentElement.querySelector('span');
    if (!myVideo.srcObject.getAudioTracks()[0].enabled && !myVideo.srcObject.getVideoTracks()[0].enabled) {
        label.textContent = 'You (Muted, Camera Off)';
    } else if (!myVideo.srcObject.getAudioTracks()[0].enabled) {
        label.textContent = 'You (Muted)';
    } else if (!myVideo.srcObject.getVideoTracks()[0].enabled) {
        label.textContent = 'You (Camera Off)';
    } else {
        label.textContent = 'You';
    }
}

function toggleAudio(state) {
    myVideo.srcObject.getAudioTracks()[0].enabled = state;
    updateMyLabel();
}
function toggleVideo(state) {
    myVideo.srcObject.getVideoTracks()[0].enabled = state;
    updateMyLabel();
}

async function createPeerConnection(userId, shouldCreateOffer) {
    const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.ontrack = event => {
        setRoomStatus('connected');
        if (!remoteVideos[userId]) {
            const video = document.createElement('video');
            video.setAttribute('data-label', 'Other Participant');
            remoteVideos[userId] = addVideoStream(video, event.streams[0], 'Other Participant');
        } else {
            remoteVideos[userId].video.srcObject = event.streams[0];
        }
    };
    peer.onicecandidate = event => {
        if (event.candidate) socket.emit('webrtc-ice-candidate', { target: userId, candidate: event.candidate });
    };
    peers[userId] = peer;
    if (shouldCreateOffer) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc-offer', { target: userId, offer });
    }
    return peer;
}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(localStream => {
    stream = localStream;
    addVideoStream(myVideo, stream);
    updateMyLabel();

    const audioBtn = document.getElementById("audio");
    audioBtn.addEventListener("click", () => {
        audiotoggle = !audiotoggle;
        toggleAudio(audiotoggle);
        audioBtn.textContent = audiotoggle ? "Mute audio" : "Unmute audio";
        audioBtn.classList.toggle("control-on", audiotoggle);
        audioBtn.classList.toggle("control-off", !audiotoggle);
    });

    const cameraBtn = document.getElementById("camera");
    cameraBtn.addEventListener("click", () => {
        videotoggle = !videotoggle;
        toggleVideo(videotoggle);
        cameraBtn.textContent = videotoggle ? "Turn off camera" : "Turn on camera";
        cameraBtn.classList.toggle("control-on", videotoggle);
        cameraBtn.classList.toggle("control-off", !videotoggle);
    });
    socket.emit('joinRoom', ROOM_ID, USER_ROLE);
}).catch(() => {
    setRoomStatus('ended', 'Camera and microphone access was denied.');
    noRemoteMsg.textContent = 'Camera and microphone access is required for a video consultation.';
    noRemoteMsg.style.display = 'block';
});

socket.on('roomUsers', (users) => {
    setRoomStatus('waiting', users.length ? 'Waiting for the other participant' : 'Waiting for the other participant');
});
socket.on('roomStatus', ({ status, waitingFor, participantCount }) => {
    const detail = status === 'joined'
        ? 'Doctor and patient joined'
        : participantCount === 0
            ? 'Ready to join'
            : `Waiting for ${waitingFor}`;
    setRoomStatus(status, detail);
    if (status === 'joined') {
        noRemoteMsg.textContent = 'Both participants joined. Connecting the consultation...';
        noRemoteMsg.style.display = 'block';
    } else if (status === 'waiting') {
        noRemoteMsg.textContent = `Waiting for ${waitingFor} to join...`;
        noRemoteMsg.style.display = 'block';
    }
});
socket.on('participantJoined', ({ participantRole }) => {
    setRoomStatus('joined', `${participantRole} joined the waiting room`);
    noRemoteMsg.textContent = `The ${participantRole} joined. Connecting the consultation...`;
    noRemoteMsg.style.display = 'block';
});
socket.on('incomingCall', ({ callerId, callerRole }) => {
    setRoomStatus('waiting', `Incoming call from ${callerRole}`);
    pendingCallerId = callerId;
    callRequestTitle.textContent = `Incoming call from ${callerRole}`;
    callRequestText.textContent = 'Accept to start this scheduled consultation.';
    callRequest.hidden = false;
});
socket.on('callWaiting', ({ participantRole }) => {
    setRoomStatus('waiting', `Waiting for the ${participantRole} to accept`);
    noRemoteMsg.textContent = `Waiting for the ${participantRole} to accept the consultation...`;
    noRemoteMsg.style.display = 'block';
});
acceptCallBtn.addEventListener('click', () => {
    if (!pendingCallerId) return;
    callAccepted = true;
    setRoomStatus('waiting', 'Connecting your consultation');
    callRequest.hidden = true;
    socket.emit('acceptCall', { callerId: pendingCallerId });
    noRemoteMsg.textContent = 'Connecting your consultation...';
});
rejectCallBtn.addEventListener('click', () => {
    if (pendingCallerId) socket.emit('rejectCall', { callerId: pendingCallerId });
    callRequest.hidden = true;
    noRemoteMsg.textContent = 'Call declined.';
});
socket.on('callAccepted', async ({ accepterId }) => {
    callAccepted = true;
    setRoomStatus('waiting', 'Participant accepted the consultation');
    if (!peers[accepterId]) await createPeerConnection(accepterId, true);
});
socket.on('callRejected', () => {
    setRoomStatus('ended', 'The other participant declined the consultation.');
    noRemoteMsg.textContent = 'The other participant declined the consultation.';
    noRemoteMsg.style.display = 'block';
});
socket.on('webrtc-offer', async ({ sender, offer }) => {
    const peer = peers[sender] || await createPeerConnection(sender, false);
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('webrtc-answer', { target: sender, answer });
});
socket.on('webrtc-answer', async ({ sender, answer }) => {
    if (peers[sender]) await peers[sender].setRemoteDescription(new RTCSessionDescription(answer));
});
socket.on('webrtc-ice-candidate', async ({ sender, candidate }) => {
    if (peers[sender]) await peers[sender].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('userDisconnected', userId => {
    setRoomStatus('waiting', 'Participant left the consultation.');
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
    }
    if (remoteVideos[userId]) {
        remoteVideos[userId].wrapper.remove();
        delete remoteVideos[userId];
        updateRemoteMsg();
    }
});

socket.on('roomFull', () => {
    setRoomStatus('ended', 'This consultation is already full.');
    noRemoteMsg.textContent = 'This consultation already has one doctor and one patient.';
    noRemoteMsg.style.display = 'block';
    document.getElementById('btnsDiv').style.display = 'none';
});

socket.on('roomAccessDenied', () => {
    setRoomStatus('ended', 'You are not allowed to join this consultation.');
    noRemoteMsg.textContent = 'Open this consultation from a logged-in doctor or patient appointment.';
    noRemoteMsg.style.display = 'block';
    document.getElementById('btnsDiv').style.display = 'none';
});

function addVideoStream(video, stream, label = "Other Participant") {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    const wrapper = document.createElement('div');
    wrapper.className = 'video-frame';
    wrapper.style.width = '100%';
    wrapper.appendChild(video);
    const videoLabel = document.createElement('span');
    videoLabel.className = 'video-label';
    videoLabel.textContent = video.getAttribute('data-label') || label;
    wrapper.appendChild(videoLabel);
    videoGrid.append(wrapper);
    updateRemoteMsg();
    return { video, wrapper };
}

const callTimer = document.getElementById("callTimer");
let timerInterval = null;
let callStarted = false;
let elapsedSeconds = 0;

function startCallTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        const min = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const sec = String(elapsedSeconds % 60).padStart(2, '0');
        callTimer.textContent = `${min}:${sec}`;
    }, 1000);
}
function stopCallTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateRemoteMsg() {
    // Show message if only one video (your own)
    if (videoGrid.childElementCount < 2) {
        noRemoteMsg.style.display = 'block';
        stopCallTimer();
        callStarted = false;
    } else {
        noRemoteMsg.style.display = 'none';
        if (!callStarted) {
            startCallTimer();
            callStarted = true;
        }
    }
}

const leaveBtn = document.getElementById('leave');
leaveBtn.addEventListener('click', () => {
    setRoomStatus('ended', 'You left the consultation.');
    // Close all peer connections
    Object.values(peers).forEach(call => call.close());
    // Stop all local media tracks
    if (myVideo.srcObject) {
        myVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    // Optionally emit a leave event to the server if needed
    // socket.emit('leaveRoom', ROOM_ID, myId);
    window.close();
});

window.addEventListener('beforeunload', () => setRoomStatus('ended', 'The consultation window was closed.'));

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// Send chat message
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    socket.emit('chatMessage', { roomId: ROOM_ID, message: msg });
    appendMessage(msg, true);
    chatInput.value = '';
}

// Receive chat message
socket.on('chatMessage', ({ message }) => {
    appendMessage(message, false);
});

function appendMessage(msg, isSelf) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<span style='font-weight:bold;color:${isSelf ? '#2980b9' : '#16a085'};'>${isSelf ? 'You' : 'Other'}:</span> <span style='background:${isSelf ? '#eaf6ff' : '#e8f8f5'};padding:6px 12px;border-radius:16px;display:inline-block;max-width:80%;word-break:break-word;'>${msg}</span>`;
    msgDiv.style.margin = '8px 0';
    msgDiv.style.textAlign = isSelf ? 'right' : 'left';
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}