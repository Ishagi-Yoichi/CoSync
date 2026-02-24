const SOCKET_ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
  UPDATE: "update",
  AWARENESS_UPDATE: "awareness-update",
  REQUEST_SYNC: "request-sync",
  SYNC_STATE: "sync-state",
  SEND_SYNC: "send-sync",
};

module.exports = { ACTIONS: SOCKET_ACTIONS };
