import { scanCube } from "/static/scan.js";
import { playSolution } from "/static/solve.js";

let scrambled_string = await scanCube();
let moveSequence = "";

// change string to computer's notation
try {
    const response = await fetch("http://127.0.0.1:5000/decode_scrambled_string", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(scrambled_string),
    });
    if (response.ok) {
        let data = await response.json();
        scrambled_string = data.message;
    }
}
catch (e) { console.error("Error:", e); }

// solve cube using Kociemba's algorithm
try {
    const response = await fetch("http://127.0.0.1:5000/get_solution", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(scrambled_string),
    });
    if (response.ok) {
        let data = await response.json();
        moveSequence = data.message;
    }
}
catch (e) { console.error("Error:", e); }

// display solution as 3d cube and move notation
playSolution(moveSequence, scrambled_string)