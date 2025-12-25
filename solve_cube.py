from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import kociemba

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5000"}})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_solution', methods=['POST'])
def get_solution():
    data = request.get_json()
    result = kociemba.solve(str(data))
    move_sequence = jsonify({"message": str(result)})
    move_sequence.headers.add("Access-Control-Allow-Origin", "*")
    return move_sequence

@app.route('/decode_scrambled_string', methods=['POST'])
def decode_scrambled_string():
    data = request.get_json()
    result = data.replace('W', 'U').replace('G', 'F').replace('O', 'L').replace('Y', 'D')
    scrambled_string = jsonify({"message": str(result)})
    scrambled_string.headers.add("Access-Control-Allow-Origin", "*")
    return scrambled_string

if __name__ == '__main__':
    app.run(debug=True, port=5000)