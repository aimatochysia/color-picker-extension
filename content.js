async function getColorAtPixel(x, y) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  try {
    const captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'never' }
    });

    const video = document.createElement('video');
    video.srcObject = captureStream;

    
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        video.onplay = resolve;
      };
    });

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const pixelData = context.getImageData(x, y, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    
    captureStream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    return { hex, rgb };

  } catch (err) {
    console.error('Error capturing screen or picking color:', err);
    return null;
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Color copied to clipboard');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
  });
}

async function pickColor(event) {
  const result = await getColorAtPixel(event.clientX, event.clientY);
  if (result) {
    const { hex, rgb } = result;
    chrome.runtime.sendMessage({ action: 'colorPicked', hex, rgb });
    copyToClipboard(hex);
  }

  document.body.style.cursor = 'default';
  document.removeEventListener('click', pickColor);
}

document.getElementById('pick-color').addEventListener('click', () => {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('click', pickColor);
});
