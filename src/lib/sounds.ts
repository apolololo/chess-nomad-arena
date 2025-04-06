import { Howl } from 'howler';

export const sounds = {
  move: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
    volume: 0.5
  }),
  capture: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'],
    volume: 0.5
  }),
  check: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'],
    volume: 0.7
  }),
  gameEnd: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'],
    volume: 0.7
  })
};