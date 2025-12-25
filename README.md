A webapp to easily scan and solve your 3x3 Rubik's cube.

## Setup

1. Clone the script:

```bash
git clone https://github.com/crazerly/rubiks-cube-solver.git
cd rubiks-cube-solver
```

2. Install flask and flask-cors:

```bash
(python -m) pip install flask flask-cors
```

3. Run the bot:

```bash
python solve_cube.py
```

4. Open the website in your browser:

```bash
http://127.0.0.1:5000/
```

## How to Use

First, orient the cube so the white face is in front of the camera and the blue face is on top.
You must follow the arrows to scan each face correctly, in the order: white, red, green, yellow, orange, blue.  
Hold the cube up to the camera so that each 'cubie' aligns with a square on the grid overlay, as shown below.
<img src="https://github.com/crazerly/rubiks-cube-solver/blob/main/static/imgs/example.png?raw=true" width="600" />

The program can normally colour the face correctly, but I have found the accuracy varies based on brightness, colour of cube's stickers, etc.  
If cubies are incorrect, you can change them using the paint tool.
**However, the colour picker won't work if the progam hasn't detected a face yet.**  
Once all six faces are scanned, use the 3d cube or the move notation to solve your Rubik's cube. The green face should be at the front and the white face on top.
