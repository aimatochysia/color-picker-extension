const maxHistorySize = 5; 
document.addEventListener('DOMContentLoaded', async () => {
  const colorHistory = await getColorHistory();
  updateColorHistoryUI(colorHistory);
  const lastColor = colorHistory[colorHistory.length - 1];
  if (lastColor) {
    updatePopupUI(lastColor);
  }
  updateSelectedEffect();
});


document.getElementById('color-format-switch').addEventListener('change', updateSelectedEffect);


function updateSelectedEffect() {
  const isRgbSelected = document.getElementById('color-format-switch').checked;
  const hexCodeElement = document.getElementById('hex-code');
  const rgbCodeElement = document.getElementById('rgb-code');

  if (isRgbSelected) {
    rgbCodeElement.classList.add('selected-text'); 
    hexCodeElement.classList.remove('selected-text'); 
  } else {
    hexCodeElement.classList.add('selected-text'); 
    rgbCodeElement.classList.remove('selected-text'); 
  }
}

document.getElementById('pick-color').addEventListener('click', async () => {
  if ('EyeDropper' in window) {
    const eyeDropper = new EyeDropper();
    try {
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      const rgb = hexToRgb(hex);

      
      document.getElementById('hex-code').textContent = `HEX: ${hex}`;
      document.getElementById('rgb-code').textContent = `RGB: ${rgb}`;
      document.getElementById('color-box').style.backgroundColor = hex;

      
      const isRgbSelected = document.getElementById('color-format-switch').checked;

      if (isRgbSelected) {
        copyToClipboard(rgb);
      } else {
        copyToClipboard(hex);
      }

      
      let colorHistory = await getColorHistory();
      colorHistory = addColorToHistory(colorHistory, hex);
      await saveColorHistory(colorHistory);

      updateColorHistoryUI(colorHistory);
      updatePopupUI(hex);

    } catch (err) {
      console.error('Error using the Eyedropper API:', err);
    }
  } else {
    alert('Your browser does not support the Eyedropper API.');
  }
});


function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgb(${r}, ${g}, ${b})`;
}


function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Color copied to clipboard');
  }).catch(err => {
    console.error('Error copying to clipboard', err);
  });
}


function setSelected(type) {
  const hexCodeElement = document.getElementById('hex-code');
  const rgbCodeElement = document.getElementById('rgb-code');
  if (type === 'hex') {
    hexCodeElement.style.color = 
    rgbCodeElement.classList.remove('selected');
  } else {
    rgbCodeElement.classList.add('selected');
    hexCodeElement.classList.remove('selected');
  }
}

function addColorToHistory(colorHistory, newColor) {
  if (colorHistory.includes(newColor)) {
    return colorHistory; 
  }
  colorHistory.push(newColor);
  if (colorHistory.length > maxHistorySize) {
    colorHistory.shift(); 
  }
  return colorHistory;
}


function saveColorHistory(colorHistory) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ colorHistory }, () => {
      resolve();
    });
  });
}


function getColorHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['colorHistory'], (result) => {
      resolve(result.colorHistory || []);
    });
  });
}


function updateColorHistoryUI(colorHistory) {
  const historyContainer = document.getElementById('color-history');
  historyContainer.innerHTML = ''; 
  colorHistory.slice().reverse().forEach(color => {
    const colorElement = document.createElement('div');
    colorElement.className = 'history-color';
    colorElement.style.backgroundColor = color;
    colorElement.title = color; 
    colorElement.addEventListener('click', () => {
      
      copyToClipboard(color);
    });
    historyContainer.appendChild(colorElement);
  });
}


function updatePopupUI(color) {
  const popup = document.body;
  const button = document.getElementById('pick-color');
  const [r, g, b] = hexToRgb(color).match(/\d+/g).map(Number);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const textColor = luminance > 128 ? '#000' : '#fff'; 
  const buttonColor = luminance > 128 ? darkenColor(color) : lightenColor(color);

  popup.style.backgroundColor = color;
  document.querySelector('h3').style.color = textColor;
  document.querySelector('.text').style.color = textColor;
  button.style.backgroundColor = buttonColor;
  button.style.color = textColor;
  const sliderBackground = document.querySelectorAll('.slider');

  sliderBackground.forEach(element => {
      element.style.backgroundColor = buttonColor;
  });
  
}


function lightenColor(hex, percent = 10) {
  let [r, g, b] = hexToRgb(hex).match(/\d+/g).map(Number);
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function darkenColor(hex, percent = 10) {
  let [r, g, b] = hexToRgb(hex).match(/\d+/g).map(Number);
  r = Math.max(0, Math.floor(r - r * (percent / 100)));
  g = Math.max(0, Math.floor(g - g * (percent / 100)));
  b = Math.max(0, Math.floor(b - b * (percent / 100)));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}
