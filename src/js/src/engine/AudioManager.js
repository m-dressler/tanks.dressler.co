// @ts-check

/**
 * reference https://web.dev/webaudio-intro/
 * @typedef {"bullet_clack"|"tank_down"} Sounds
 */

/** @type {Sounds[]} */
const soundNames = ['bullet_clack', 'tank_down'];

/** @type {{[name:string]:AudioBuffer}} */
const sounds = {}

/** @type {AudioContext} */
const audioContext = new AudioContext();

export const load = () => {
  for (let i = 0; i < soundNames.length; ++i)
    fetch(`/res/audio/${soundNames[i]}.mp3`)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => sounds[soundNames[i]] = audioBuffer);

  console.log("Loaded", soundNames)
};

/**
 * @param {Sounds} name 
 */
export const play = (name) => {
  const source = audioContext.createBufferSource(); // creates a sound source
  source.buffer = sounds[name]; // tell the source which sound to play
  source.connect(audioContext.destination); // connect the source to the context's destination (the speakers)
  source.start(0); // play the source now
}

