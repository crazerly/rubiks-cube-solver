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
You must follow the arrows to scan each face correctly, in the order: white, red, green, yellow, orange, blue.  
Hold the cube up to the camera so that each 'cubie' aligns with a square on the grid overlay, as shown below.
<img src="https://github.com/crazerly/rubiks-cube-solver/blob/main/static/imgs/example.png?raw=true" width="600" />  
  
The program can normally colour the face correctly, but I have found the accuracy varies based on brightness, colour of cube's stickers, etc.  
If one or two cubies are incorrect, you can change them using the paint tool.  
If the program is not displaying the coloured face at all, it probably means some of the squares in the camera grid are too far from the expected colour, so it doesn't detect the cube. I might create a better algorithm for face detection later, but right now I've just been holding something very close to the camera so it displays a random colour, and then use the colour picker to fix it.  
**The colour picker won't work if the progam hasn't detected a face yet.**

Once all six faces are scanned, use the 3d cube or the move notation to solve your Rubik's cube.
