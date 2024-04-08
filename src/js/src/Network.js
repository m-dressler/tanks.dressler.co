import { addRemoteConnection } from "./Ouitanks.js";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const getIceCandidates = async (peerConnection) => {
  const candidates = [];
  peerConnection.addEventListener("icecandidate", ({ candidate }) => {
    if (candidate) candidates.push(candidate);
  });
  await new Promise((res) => {
    peerConnection.addEventListener("icegatheringstatechange", () => {
      if (peerConnection.iceGatheringState === "complete") res();
    });
  });
  return candidates;
};

const addRemoteIceCandidates = async (peerConnection, candidates) => {
  for (const candidate of candidates) {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  }
};

/**
 *
 * @param {RTCPeerConnection} peerConnection
 * @returns
 */
const createConnectionPromise = (peerConnection) => {
  return new Promise((res, rej) => {
    const listener = () => {
      const connectionState = peerConnection.connectionState;
      if (connectionState === "connected") {
        res();
        peerConnection.removeEventListener("connectionstatechange", listener);
      } else if (
        connectionState === "closed" ||
        connectionState === "disconnected" ||
        connectionState === "failed"
      ) {
        rej();
        peerConnection.removeEventListener("connectionstatechange", listener);
      }
    };
    peerConnection.addEventListener("connectionstatechange", listener);
  });
};

export const createServer = async () => {
  const peerConnection = new RTCPeerConnection(configuration);
  // This is where our communication will take place
  const dataChannel = peerConnection.createDataChannel("oui-tanks");

  // We create the connection offer and set it as our connection description
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  dataChannel.onopen = () => addRemoteConnection(dataChannel);

  // Now we collect ICE candidates and wait until collection is complete
  const candidates = await getIceCandidates(peerConnection);

  const acceptConnection = async ({ answer, candidates: remoteCandidates }) => {
    const remoteDesc = new RTCSessionDescription(answer);
    await peerConnection.setRemoteDescription(remoteDesc);
    addRemoteIceCandidates(peerConnection, remoteCandidates);
  };
  return {
    acceptConnection,
    offer: { offer, candidates },
    connectionPromise: createConnectionPromise(peerConnection),
  };
};

export const connectServer = async ({
  offer,
  candidates: remoteCandidates,
}) => {
  const peerConnection = new RTCPeerConnection(configuration);
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  peerConnection.addEventListener(
    "datachannel",
    (event) => (event.channel.onopen = () => addRemoteConnection(event.channel))
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Now we collect ICE candidates and wait until collection is complete
  const candidates = await getIceCandidates(peerConnection);

  addRemoteIceCandidates(peerConnection, remoteCandidates);

  return {
    answer: { answer, candidates },
    connectionPromise: createConnectionPromise(peerConnection),
  };
};
