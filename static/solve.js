const colourMap = {
  U: 0xffffff,
  R: 0xff0000,
  F: 0x00a000,
  D: 0xffff00,
  L: 0xff8000,
  B: 0x0000ff,
};

const axisForFace = {
  U: new THREE.Vector3(0, 1, 0),
  R: new THREE.Vector3(1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  D: new THREE.Vector3(0, 1, 0),
  L: new THREE.Vector3(1, 0, 0),
  B: new THREE.Vector3(0, 0, 1),
};

const signForFace = {
  U: -1,
  R: -1,
  F: -1,
  D: 1,
  L: 1,
  B: 1,
};

const canvasWidth = 360;
const canvasHeight = 360;
const highlightTime = 1000;

const cubies = [];
let scrambleString = "";

function faceletIndexFor(face, x, y, z) {
  let r, c;
  switch (face) {
    case "U":
      r = z + 1;
      c = x + 1;
      break;
    case "R":
      r = 1 - y;
      c = 1 - z;
      break;
    case "F":
      r = 1 - y;
      c = x + 1;
      break;
    case "D":
      r = 1 - z;
      c = x + 1;
      break;
    case "L":
      r = 1 - y;
      c = z + 1;
      break;
    case "B":
      r = 1 - y;
      c = 1 - x;
      break;
    default:
      return null;
  }
  if (r < 0 || r > 2 || c < 0 || c > 2) return null;
  return r * 3 + c;
}

function parseScramble(str) {
  if (!str || str.length != 54) throw new Error("Scramble string must be 54 chars.");
  const faces = {};
  const order = ["U", "R", "F", "D", "L", "B"];
  let i = 0;
  for (const f of order) {
    faces[f] = str.slice(i, i + 9).split("");
    i += 9;
  }
  return faces;
}

function createCubie(cubieSize, x, y, z) {
  const scramble = parseScramble(scrambleString);
  const geometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);

  const mats = [
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  ];

  // calculates face's facelet in the scramble string and sets the corresponding material's colour
  if (x == 1) {
    const i = faceletIndexFor("R", x, y, z);
    if (i != null) {
      const letter = scramble.R[i];
      mats[0].color.set(colourMap[letter]);
    }
  }
  if (x == -1) {
    const i = faceletIndexFor("L", x, y, z);
    if (i != null) {
      const letter = scramble.L[i];
      mats[1].color.set(colourMap[letter]);
    }
  }
  if (y == 1) {
    const i = faceletIndexFor("U", x, y, z);
    if (i != null) {
      const letter = scramble.U[i];
      mats[2].color.set(colourMap[letter]);
    }
  }
  if (y == -1) {
    const i = faceletIndexFor("D", x, y, z);
    if (i != null) {
      const letter = scramble.D[i];
      mats[3].color.set(colourMap[letter]);
    }
  }
  if (z == 1) {
    const i = faceletIndexFor("F", x, y, z);
    if (i != null) {
      const letter = scramble.F[i];
      mats[4].color.set(colourMap[letter]);
    }
  }
  if (z == -1) {
    const i = faceletIndexFor("B", x, y, z);
    if (i != null) {
      const letter = scramble.B[i];
      mats[5].color.set(colourMap[letter]);
    }
  }

  return new THREE.Mesh(geometry, mats);
}

// filters the 'cubies' array based on the cubie's position coord in the scene
function getFaceCubies(face) {
  const faceThreshold = 0.6; // prevents inaccuracies when selecting face cubies
  switch (face) {
    case "R": return cubies.filter(c => c.position.x > faceThreshold);
    case "L": return cubies.filter(c => c.position.x < -faceThreshold);
    case "U": return cubies.filter(c => c.position.y > faceThreshold);
    case "D": return cubies.filter(c => c.position.y < -faceThreshold);
    case "F": return cubies.filter(c => c.position.z > faceThreshold);
    case "B": return cubies.filter(c => c.position.z < -faceThreshold);
    default: return [];
  }
}

// gets move tokens from scramble string
function parseMoves(sequence) {
  if (!sequence || !sequence.trim()) return [];
  return sequence.trim().split(/\s+/).filter(Boolean);
}

async function playMoveHighlight(token, animPromise) {
  if (!token) return;
  token.classList.add("active");
  token.focus({ preventScroll: true });

  await Promise.all([
    (async () => { try { await animPromise; } catch(e) {} })(),
    new Promise(r => setTimeout(r, highlightTime))
  ]);

  token.classList.remove("active");
  token.classList.add("done");
}

function createMoveList(sequence) {
  const moves = (sequence || "").trim().split(/\s+/).filter(Boolean);
  const container = document.createElement("div");
  container.className = "rubiks-move-container";

  const tokens = moves.map((m, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rubiks-token";
    btn.textContent = m;
    btn.dataset.index = i;
    container.appendChild(btn);
    return btn;
  });
  return { container, tokens };
}

export async function playSolution(moveSequence, cubeString) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xebebeb);
  const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
  camera.position.set(5, 6, 8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(canvasWidth, canvasHeight);
  document.body.appendChild(renderer.domElement);

  scrambleString = cubeString;

  const cubieSize = 1.3;
  const spacing = 1.4;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const cubie = createCubie(cubieSize, x, y, z);
        cubie.position.set(x * spacing, y * spacing, z * spacing);
        scene.add(cubie);
        cubies.push(cubie);
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
  
  async function animateMove(move) {
    return new Promise((resolve) => {
      const face = move[0];
      if (!axisForFace[face]) {
        resolve();
        return;
      }

      let quarterTurns = 1;
      if (move.endsWith("2")) quarterTurns = 2;
      if (move.endsWith("'")) quarterTurns = -1;

      quarterTurns *= signForFace[face];

      const faceCubies = getFaceCubies(face);
      if (faceCubies.length == 0) {
        resolve();
        return;
      }

      const group = new THREE.Group();
      scene.add(group);

      // move cubies into temp group while preserving their current world transform
      faceCubies.forEach((c) => {
        const worldPos = new THREE.Vector3();
        c.getWorldPosition(worldPos);
        group.add(c);

        const localPos = group.worldToLocal(worldPos.clone());
        c.position.copy(localPos);

        const worldQuat = new THREE.Quaternion();
        c.getWorldQuaternion(worldQuat);
        const groupWorldQuat = new THREE.Quaternion();
        group.getWorldQuaternion(groupWorldQuat);
        const invGroupWorldQuat = groupWorldQuat.clone().invert();
        c.quaternion.copy(invGroupWorldQuat.multiply(worldQuat));
      });

      const axis = axisForFace[face].clone().normalize();
      const totalAngle = (Math.PI / 2) * quarterTurns;

      const duration = 800 * Math.abs(quarterTurns || 1);
      const start = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const currentAngle = totalAngle * t;

        // rotates the group of cubies
        group.setRotationFromQuaternion(new THREE.Quaternion());
        group.rotateOnAxis(axis, currentAngle);

        if (t < 1) { requestAnimationFrame(tick); } 
        else {
          // set cubies back into scene after animation
          faceCubies.forEach((c) => {
            const finalWorldPos = new THREE.Vector3();
            c.getWorldPosition(finalWorldPos);
            const finalWorldQuat = new THREE.Quaternion();
            c.getWorldQuaternion(finalWorldQuat);

            group.remove(c);
            scene.add(c);

            c.position.copy(finalWorldPos);
            c.quaternion.copy(finalWorldQuat);
          });
          scene.remove(group);

          setTimeout(resolve, 30);
        }
      }

      requestAnimationFrame(tick);
    });
  }
  
  const moves = parseMoves(moveSequence);
  const { container: moveListContainer, tokens: moveTokens } = createMoveList(moveSequence);
  renderer.domElement.insertAdjacentElement("afterend", moveListContainer);

  async function play() {
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveAnimation = animateMove(move);
      const highlightAnimation = playMoveHighlight(moveTokens[i], moveAnimation);
      await Promise.all([moveAnimation, highlightAnimation]);
      await new Promise(r => setTimeout(r, 140));
    }
  }

  play().catch(err => console.error("Playback error:", err));
}
