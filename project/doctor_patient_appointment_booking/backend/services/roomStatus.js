const roomStatuses = new Map();

const updateRoomStatus = (roomId, users = []) => {
  const roles = users.map((user) => user.role);
  const status = users.length >= 2 ? "joined" : users.length === 1 ? "waiting" : "ready";
  const waitingFor = users.length === 0 ? "doctor and patient" : roles.includes("doctor") ? "patient" : "doctor";
  const nextStatus = { status, waitingFor, participantCount: users.length, updatedAt: Date.now() };
  roomStatuses.set(roomId, nextStatus);
  return nextStatus;
};

const getRoomStatus = (roomId) => roomStatuses.get(roomId) || {
  status: "ready",
  waitingFor: "doctor and patient",
  participantCount: 0,
  updatedAt: Date.now(),
};

module.exports = { updateRoomStatus, getRoomStatus };