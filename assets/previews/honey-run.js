const video = document.querySelector('#run');
const play = document.querySelector('#play');
play.addEventListener('click', async () => {
  if (!video.paused) { video.pause(); return; }
  try { await video.play(); } catch { document.querySelector('#status').textContent = 'Нажмите воспроизведение на видео.'; }
});
video.addEventListener('play', () => { play.textContent = 'Пауза'; });
video.addEventListener('pause', () => { play.textContent = 'Смотреть бег'; });
document.querySelector('#speed').addEventListener('click', (event) => {
  video.playbackRate = video.playbackRate === 1 ? 0.5 : 1;
  event.currentTarget.textContent = `Скорость: ${video.playbackRate === 1 ? '1' : '0,5'}×`;
});
document.querySelector('#scale').addEventListener('click', (event) => {
  const small = document.querySelector('.stage').classList.toggle('small');
  event.currentTarget.textContent = small ? 'Крупный план' : 'Игровой масштаб';
});
video.addEventListener('error', () => { document.querySelector('#status').textContent = 'Видео не загрузилось. Обновите страницу, чтобы повторить загрузку.'; });
