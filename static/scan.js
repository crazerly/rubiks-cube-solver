const scanPageContainer = document.createElement('div');
scanPageContainer.id = 'scan-page';

const videoContainer = document.createElement('div');
videoContainer.style.position = 'relative';
videoContainer.style.display = 'inline-block';
videoContainer.style.lineHeight = '0';

const camVideo = document.createElement('video');
camVideo.id = 'cam-video';
camVideo.autoplay = true;
camVideo.muted = true;
camVideo.playsInline = true;

const gridOverlay = document.createElement('canvas');
gridOverlay.id = 'grid-overlay';
const ctxGrid = gridOverlay.getContext('2d');

const cubeFaceRow = document.createElement('div');
cubeFaceRow.id = 'cube-face-row';

const cubeFace = document.createElement('canvas');
cubeFace.id = 'cube-face';
const ctxFace = cubeFace.getContext('2d');

const colourPalette = document.createElement('div');
colourPalette.id = 'colour-palette';

const buttonRow = document.createElement('div');
buttonRow.id = 'button-row';

const tryAgainBtn = document.createElement('button');
tryAgainBtn.id = 'try-again-btn';
tryAgainBtn.textContent = 'Try Again';

const nextFaceBtn = document.createElement('button');
nextFaceBtn.id = 'next-face-btn';
nextFaceBtn.textContent = 'Next Face';

videoContainer.appendChild(camVideo);

cubeFaceRow.appendChild(cubeFace);
cubeFaceRow.appendChild(colourPalette);

buttonRow.appendChild(tryAgainBtn);
buttonRow.appendChild(nextFaceBtn);

scanPageContainer.appendChild(videoContainer);
scanPageContainer.appendChild(cubeFaceRow);
scanPageContainer.appendChild(buttonRow);
document.body.appendChild(scanPageContainer);

// HSL colour values used to guess colour in camera
const cubeColours = {
    'W': [23, 23, 70],
    'Y': [45, 65, 85],
    'R': [2, 70, 75],
    'O': [10, 70, 70],
    'B': [220, 30, 28],
    'G': [135, 45, 25],
};

let faces = "";
let currFace = [];
const scanTurns = [3, 0, 2, 3, 1, 2, 2] // up, right, left, up, down, left, left

cubeFace.width = 180;
cubeFace.height = 180;

const colourMap = {
  W: 'white',
  Y: 'yellow',
  R: 'red',
  O: 'orange',
  B: 'blue',
  G: 'green'
};
let selectedColour = '';

async function startCamera() {
    const constraints = {
        video: {
            width: 360,
            height: 360,
            facingMode: "environment",
        },
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        camVideo.srcObject = stream;
    }
    catch (error) { console.error('Error accessing camera:', error); }
}

async function drawOverlayGrid(width, height) {
  const videoRect = camVideo.getBoundingClientRect();
  gridOverlay.style.top = `${videoRect.top}px`;
  gridOverlay.style.left = `${videoRect.left}px`;

  gridOverlay.width = width;
  gridOverlay.height = height;

  ctxGrid.clearRect(0, 0, width, height);
  ctxGrid.strokeStyle = 'white';
  ctxGrid.lineWidth = 2;

  const numRows = 3;
  const numCols = 3;

  const rowHeight = height / numRows;
  const colWidth = width / numCols;

  for (let i = 0; i <= numCols; i++) {
      const x = i * colWidth;
      ctxGrid.beginPath();
      ctxGrid.moveTo(x, 0);
      ctxGrid.lineTo(x, height);
      ctxGrid.stroke();
  }
  for (let i = 0; i <= numRows; i++) {
    const y = i * rowHeight;
    ctxGrid.beginPath();
    ctxGrid.moveTo(0, y);
    ctxGrid.lineTo(width, y);
    ctxGrid.stroke();
  }
  
  scanPageContainer.appendChild(gridOverlay);
}

function getAverageRGBColour(context, x, y, size) {
  const offset = size * 0.3;
  const data = context.getImageData(x + offset, y + offset, size * 0.4, size * 0.4).data;
  let r = 0, g = 0, b = 0;
  const numPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return [Math.round(r / numPixels), Math.round(g / numPixels), Math.round(b / numPixels) ];
}

function rgbToHSV(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
  
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h, s, v = max;
    s = d / max;
    const rc = (max - r) / d;
    const gc = (max - g) / d;
    const bc = (max - b) / d;

    // calculates the hue based on the colour's pos in the colour wheel
    if (r == max) h = 0.0 + bc - gc;
    else if (g == max) h = 2.0 + rc - bc;
    else h = 4.0 + gc - rc;
    h = (h / 6.0) % 1.0;

    return [h * 360, s * 100, v * 100];
}

function getHSVDistance(hsv1, hsv2) {
    let dh = Math.abs(hsv1[0] - hsv2[0]);
    if (dh > 180) dh = 360 - dh;
    const ds = hsv1[1] - hsv2[1];
    const dv = hsv1[2] - hsv2[2];
    return Math.sqrt(dh * dh + ds * ds + dv * dv);
}

function decodeFace() {
  let invalidImage = false;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = camVideo.videoWidth;
  canvas.height = camVideo.videoHeight;

  context.drawImage(camVideo, 0, 0, canvas.width, canvas.height);
  const squareW = canvas.width / 3;
  const colours = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const avgColour = getAverageRGBColour(context, col * squareW, row * squareW, squareW);
        colours.push(avgColour);
    }
  }

  let totalDist = 0;

  colours.forEach((colour) => {
    const colourHSV = rgbToHSV(colour[0], colour[1], colour[2]);
    let closest = null;
    let closestDist = Infinity;
    for (const [name, refColour] of Object.entries(cubeColours)) {
        const dist = getHSVDistance(colourHSV, refColour);
        if (dist < closestDist) {
            closestDist = dist;
            closest = name;
        }
    }
    // to correct for glare and darkness, etc.
    if (closest == 'W' && colourHSV[2] <= 40) closest = 'B'; 
    if (closest == 'O' && colourHSV[0] <= 7) closest = 'R'; 
    if (closest == 'R' && colourHSV[0] >= 10) closest = 'O'; 
    if (closestDist > 50) invalidImage = true;
    totalDist += closestDist;
    currFace.push(closest);
  });
  if (invalidImage || totalDist > 200) {
      currFace = [];
      return false;
  }
  return true;
}

function drawCubeFace() {
  ctxFace.clearRect(0, 0, cubeFace.width, cubeFace.height);
  const size = cubeFace.width / 3;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const letter = currFace[idx];
      ctxFace.fillStyle = colourMap[letter];
      ctxFace.fillRect(col * size, row * size, size, size);
      ctxFace.strokeStyle = 'black';
      ctxFace.lineWidth = 2;
      ctxFace.strokeRect(col * size, row * size, size, size);
    }
  }
}

function resetCubeFace() {
  currFace = Array(9).fill('W');
  drawCubeFace(currFace);
  currFace = []; 
}

for (const [letter, colour] of Object.entries(colourMap)) {
  const btn = document.createElement('div');
  btn.style.backgroundColor = colour;
  btn.style.width = '30px';
  btn.style.height = '30px';
  btn.style.margin = '5px';
  btn.style.borderRadius = '50%';
  btn.style.border = '2px solid black';
  btn.style.cursor = 'pointer';

  btn.addEventListener('click', () => {
    selectedColour = letter;

    document.querySelectorAll('#colour-palette div').forEach(div => {
      div.style.outline = '';
    });
    btn.style.outline = '3px solid #555';
  });

  colourPalette.appendChild(btn);
};

cubeFace.addEventListener('click', (e) => {
  const rect = cubeFace.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const size = cubeFace.width / 3;

  const col = Math.floor(x / size);
  const row = Math.floor(y / size);
  const idx = row * 3 + col;

  currFace[idx] = selectedColour;
  drawCubeFace();
});

async function slideArrow(dir) {
  return new Promise((resolve) => {
    const rotations = [0, 90, 180, 270];
    const rotation = rotations[dir];
    const W = camVideo.clientWidth || camVideo.videoWidth || 360;
    const H = camVideo.clientHeight || camVideo.videoHeight || 360;

    // arrow size relative to video size
    const S = 0.3 * Math.min(W, H);

    const arrow = new Image();
    arrow.src = 'static/imgs/arrow.png';
    Object.assign(arrow.style, {
      position: 'absolute',
      width: `${S}px`,
      height: `${S}px`,
      pointerEvents: 'none',
      zIndex: '10',
      opacity: '0',
      transform: `rotate(${rotation}deg)`,
      willChange: 'transform,left,top',
    });

    const centerX = (W - S) / 2;
    const centerY = (H - S) / 2;
    const offset = 20;
    let startX, startY, endX, endY;

    switch (dir) {
      case 0: // right
        startX = offset;            endX = W - (S + offset);
        startY = centerY;           endY = centerY;
        break;
      case 1: // down
        startX = centerX;           endX = centerX;
        startY = offset;            endY = H - (S + offset);
        break;
      case 2: // left
        startX = W - (S + offset);  endX = offset;
        startY = centerY;           endY = centerY;
        break;
      case 3: // up
        startX = centerX;           endX = centerX;
        startY = H - (S + offset);  endY = offset;
        break;
    }

    arrow.style.left = `${startX}px`;
    arrow.style.top = `${startY}px`;
    videoContainer.appendChild(arrow);

    const duration = 600;
    const startTime = performance.now();
    let i = 0;
    function animate(now) {
      i += 0.03;
      const t = Math.min(1, (now - startTime) / duration);
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      arrow.style.left = `${x}px`;
      arrow.style.top = `${y}px`;
      arrow.style.opacity = `${i}`;

      if (t < 1) { requestAnimationFrame(animate); }
      else {
        arrow.remove();
        resolve();
      }
    }
    requestAnimationFrame(animate);
  });
}

function getButtonPress() {
  return new Promise((resolve) => {
    function onTryAgain() {
      tryAgainBtn.removeEventListener('click', onTryAgain);
      nextFaceBtn.removeEventListener('click', onNextFace);
      resolve({ action: 'tryAgain' });
    }

    function onNextFace() {
      tryAgainBtn.removeEventListener('click', onTryAgain);
      nextFaceBtn.removeEventListener('click', onNextFace);
      resolve({ action: 'nextFace' });
    }

    tryAgainBtn.addEventListener('click', onTryAgain);
    nextFaceBtn.addEventListener('click', onNextFace);
  });
}

export async function scanCube() {
  await startCamera();
  await new Promise(resolve => {
      camVideo.addEventListener('loadedmetadata', resolve, { once: true });
  });
  drawOverlayGrid(camVideo.videoWidth, camVideo.videoHeight);
  await new Promise(r => setTimeout(r, 100));

  // scan each cube face
  let j = 0;
  for (let i = 0; i < 6; i++) {
    resetCubeFace();
    while (true) {
        if (decodeFace()) break;
        await new Promise(r => setTimeout(r, 200));
    }
    drawCubeFace();

    const choice = await getButtonPress();
    if (choice.action == 'tryAgain') i--;
    else if (choice.action == 'nextFace') {
      faces += currFace.join('');
      if (i == 5) continue;
      slideArrow(scanTurns[j++]);
      if (i == 0) {
        await new Promise(r => setTimeout(r, 1000));
        slideArrow(scanTurns[++j]);
      }
      else if (i == 3) {
        await new Promise(r => setTimeout(r, 1000));
        slideArrow(scanTurns[++j]);
      }
    }
  }
  scanPageContainer.remove();
  return faces;
}