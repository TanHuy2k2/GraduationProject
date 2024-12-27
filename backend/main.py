from flask import Flask, request, jsonify
from PIL import Image
import os
import io
import numpy as np
import base64
from deepface import DeepFace
from qdrant import verify, load_face_data, save_face_data, update_db
from Access_sheet import get_sheet1_info, get_sheet2_info, get_sheet3_info
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Enable CORS for all routes and methods from your frontend origin
CORS(app)

# Define the necessary functions
def img_to_encoding(image):
    embedding = DeepFace.represent(image, "Facenet", enforce_detection=False)[0]["embedding"]
    return embedding

@app.route('/checkface', methods=['POST'])
def process_image():
    data = request.get_json()
    image_base64 = data.get('image')
    
    if not image_base64:
        return jsonify({'error': 'No image provided'}), 400

    image_data = image_base64.split(',')[1]

    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes ))

    # Convert PIL Image to numpy array
    image_array = np.array(image)

    face_embed = img_to_encoding(image_array)

    check = verify(face_embed)

    if check: 
        id, name, gender, age, level, bmi = load_face_data(face_embed)
        return jsonify({'check': 'True', 'id':id, 'name': name, 'age': age, 'gender': gender, 'level': level, "bmi": bmi})
    
    return jsonify({'check': 'False', 'id': "", 'name': "" ,'age': "", 'gender': "", 'level': "", "bmi": ""})

@app.route('/put2DB', methods=['POST'])
def putDB():
    data = request.get_json()
    image_base64 = data.get('image')
    name = data.get('name')
    age = data.get('age')
    gender = data.get('gender')
    height = data.get('height')
    weight = data.get('weight')
    level = data.get('level')
    bmi = data.get('bmi')

    if not image_base64:
        return jsonify({'error': 'No image'}), 400
    
    if not age:
        return jsonify({'error': 'No age'}), 400
    
    if not gender:
        return jsonify({'error': 'No gender'}), 400
    
    if not height:
        return jsonify({'error': 'No gender'}), 400
    
    if not weight:
        return jsonify({'error': 'No gender'}), 400
    
    if not level:
        return jsonify({'error': 'No gender'}), 400
    
    if not bmi:
        return jsonify({'error': 'No gender'}), 400

    image_data = image_base64.split(',')[1]

    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes ))

    # Convert PIL Image to numpy array
    image_array = np.array(image)

    face_embed = img_to_encoding(image_array)

    id = save_face_data(face_embed, {"id": 0, "name": name, "gender": str(gender), "age": str(age), "height": str(height), "weight": str(weight), "level": str(level), "bmi": bmi})

    return jsonify({'check': 'True', "id": id, 'name': name, 'age': age, 'gender': gender, 'height': height, 'weight': weight, 'level': level, 'bmi': bmi})

@app.route('/update_inf', methods=['POST'])
def Update():
    data = request.get_json()
    point_id = data.get('point_id')
    exercise = data.get('exercise_db')
    form = data.get('form_db')

    data = {exercise: form}

    update_db(point_id, data)

    return jsonify({'check': 'True'})

@app.route('/get_exercise_1', methods=['POST'])
def Get_EX_1():
    data = request.get_json()
    age = data.get('age')
    gender = data.get('gender')
    level = data.get('level')    
    bmi = data.get('bmi')

    if age:
        [first, last] = age.strip().split('-')

    if int(last) < 18:
        age_lb = "15-18"
    elif int(last) < 30:
        age_lb = "18-30"
    elif int(last) <= 50:
        age_lb = "30-50"
    else: age_lb = ">50"

    result = get_sheet1_info(gender, age_lb, bmi, level)

    if result:
        return jsonify({'check': 'True', 'db_weights': str(result['db_weights']), 'rest': str(result['rest']), 'sets': str(result['sets']), 'reps': str(result['reps'])})
    return jsonify({'check': 'False', 'db_weights': "", 'rest': "", 'sets': "", 'reps': ""})
    
@app.route('/get_exercise_2', methods=['POST'])
def Get_EX_2():
    data = request.get_json()
    age = data.get('age')
    gender = data.get('gender')
    level = data.get('level')    

    if age:
        [first, last] = age.strip().split('-')

    if int(last) < 18:
        age_lb = "15-18"
    elif int(last) < 30:
        age_lb = "18-30"
    elif int(last) <= 50:
        age_lb = "30-50"
    else: age_lb = ">50"

    result = get_sheet2_info(gender, age_lb, level)
    
    if result:
        return jsonify({'check': 'True', 'rest': str(result['rest']), 'sets': str(result['sets']), 'reps': str(result['reps'])})
    return jsonify({'check': 'False', 'rest': "", 'sets': "", 'reps': ""})

@app.route('/get_exercise_3', methods=['POST'])
def Get_EX_3():
    data = request.get_json()
    age = data.get('age')
    gender = data.get('gender')
    bmi = data.get('bmi')
    level = data.get('level')    

    if age:
        [first, last] = age.strip().split('-')

    if int(last) < 18:
        age_lb = "15-18"
    elif int(last) < 30:
        age_lb = "18-30"
    elif int(last) <= 50:
        age_lb = "30-50"
    else: age_lb = ">50"

    result = get_sheet3_info(gender, age_lb, bmi, level)
    
    if result:
        return jsonify({'check': 'True', 'rest': str(result['rest']), 'sets': str(result['sets']), 'reps': str(result['reps'])})
    return jsonify({'check': 'False', 'rest': "", 'sets': "", 'reps': ""})

if __name__ == '__main__':
    app.run(debug=False, port = 2000)
