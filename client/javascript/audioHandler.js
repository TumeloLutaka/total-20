const bgMusic = document.querySelector("#bg-music")

const startAudio = () => {
    bgMusic.volume = .3;
  bgMusic.play();
  // Remove the listener so it doesn't try to play again on every click
  window.removeEventListener('click', startAudio);
};

window.addEventListener('click', startAudio);

export function playSfx(name){
    const audio = new Audio(`/audio/sfx/${name}.wav`)
    audio.volume = .7
    audio.play()
}