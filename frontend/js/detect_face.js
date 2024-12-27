const video = document.getElementById('camera');
const toggleButton = document.getElementById('toggleButton');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });
const drawingUtils = window;
const container = document.getElementById('container');

const formContainer = document.querySelector('.form_container');
let loginForm = document.getElementById("form");
const input_name = document.getElementById('name');
const input_gender = document.getElementById('gender');
const input_height = document.getElementById('height');
const input_weight = document.getElementById('weight');
const input_level = document.getElementsByName('level');
const selectBox = document.getElementById('ageSelect');


let startAngle = 0;
const radius = 90;

const ar_age = [];
const ar_gender = [];
let camera = null;
let faceDetection = null;
let check = false
let face;
formContainer.style.display = 'none';
let isLoading = true;

// Worker
let worker = new Worker('js/worker.js');

// Function to handle results from worker
worker.onmessage = function(e) {
    const { type, result } = e.data;

    console.log(type)

    if (type === 'checkFaceResult') {
        if (result['check'] === 'True') {
            // Redirect after successful face check
            document.cookie = "id=" + result['id'];
            document.cookie = "name=" + result['name'];
            document.cookie = "age=" + result['age'];
            document.cookie = "gender=" + result['gender'];
            document.cookie = "level=" + result['level'];
            document.cookie = "bmi=" + result['bmi'];
            location.href = 'http://127.0.0.1:3000/frontend/check_exercise.html';
            check = true
        } else {
            if (face) {
                check = false
                const tensorImage = tf.browser.fromPixels(face);
                predictAndStore(tensorImage);
            }
        }
    }
    
    if (type === 'put2DBResult') {
        if (result['check'] === 'True') {
            // Redirect after successfully saving to DB
            document.cookie = "id=" + result['id'];
            document.cookie = "name=" + result['name'];
            document.cookie = "age=" + result['age'];
            document.cookie = "gender=" + result['gender'];
            document.cookie = "level=" + result['level'];
            document.cookie = "bmi=" + result['bmi'];
            location.href = 'http://127.0.0.1:3000/frontend/check_exercise.html';
            worker.terminate();
        } else {
            console.error('Error while saving data to the database.');
        }
    }
};

function showNotification(message) {
    notification.style.display = "block";
    notification.textContent = message;
  
    // Remove the notification after 5 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
}

async function onResults(results) {
    // Set the canvas size to match the video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const pixelRatio = 1;

    // Set the canvas resolution (high-DPI support)
    canvasElement.width = videoWidth * pixelRatio;
    canvasElement.height = videoHeight * pixelRatio;
    canvasElement.style.width = `${videoWidth}px`;
    canvasElement.style.height = `${videoHeight}px`;
    
    // Scale the drawing context to account for pixel ratio
    canvasCtx.scale(pixelRatio, pixelRatio);

    // Draw the image from the results
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    
    // Draw the results image maintaining the aspect ratio
    canvasCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

    if (results.detections && results.detections.length > 0) {
        const detection = results.detections[0];

        if (detection){
            drawingUtils.drawRectangle(
                canvasCtx, detection.boundingBox,
                {color: 'blue', lineWidth: 2, fillColor: '#00000000'});

            // Extract the face based on bounding box dimensions
            const {xCenter, yCenter, width, height} = detection.boundingBox;

            const startX = (xCenter - (width / 2)) * videoWidth;
            const startY = (yCenter - (height / 2)) * videoHeight;
            const faceWidth = width * videoWidth;
            const faceHeight = height * videoHeight;

            face = canvasCtx.getImageData(startX, startY, faceWidth, faceHeight);
 
            if (face && !check){

                const canvas_1 = document.createElement('canvas');
                const context_1 = canvas_1.getContext('2d');
                canvas_1.width = face.width;
                canvas_1.height = face.height;
                context_1.putImageData(face, 0, 0);
                const imageBase64 = canvas_1.toDataURL('image/jpeg', 1.0);

                worker.postMessage({ type: 'checkFace', image64: imageBase64 });

                check = true;
            }
        }
    }
    canvasCtx.restore();
}

async function predictAndStore(tensorImage) {
    // Assuming you have a predict function that returns [age, gender] predictions
    const result = await predict(tensorImage);

    // If both arrays have 3 predictions each, compute the most common values
    if (ar_age.length < 3 && ar_gender.length < 3) {

        // Push the results to the arrays
        ar_age.push(result[0]);  // Assuming result[0] is age
        ar_gender.push(result[1]);  // Assuming result[1] is gender

        if (ar_age.length == 3 && ar_gender.length == 3) {

            console.log(ar_age)

            const uniqueRanges = [...new Set(ar_age)];

            // const age = mostCommon(ar_age);
            const age = selectBox.value;
            const gender = mostCommon(ar_gender);

            const [first, last] = age.trim().split("-");
            if (parseInt(last) < 15){
                showNotification("Sorry but you are not old enough.")
            }else{
                // Display the form and populate it with predicted values
                formContainer.style.display = 'block';

                uniqueRanges.forEach(range => {
                    const option = document.createElement('option');
                    option.value = range;
                    option.textContent = range;
                    selectBox.appendChild(option);
                });

                input_gender.value = gender;

                video.style.display = 'none';
                toggleButton.style.display = 'none';

                // Mark the face as processed and stop the camera
                check = true;
            }
            stopCamera();
        }
    }
}

// Initialize FaceDetection instance
function initializeFaceDetection() {
    faceDetection = new FaceDetection({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
    }});

    faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.7
    });

    faceDetection.onResults(onResults);
}

// Function to start the camera
function startCamera() {
    initializeFaceDetection();
    check = false;
    if (isLoading){
        isLoading = false;
    }
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    count = 0;
    camera = new Camera(video, {
        onFrame: async () => {
            await faceDetection.send({image: video});
        },
        width: 640,
        height: 480
    });
    formContainer.style.display = 'none';
    document.cookie = "name=";
    document.cookie = "age=";
    document.cookie = "gender=";
    document.cookie = "bmi=";
    document.cookie = "level=";
    camera.start();      
    toggleButton.textContent = 'Turn Off Camera';
    toggleButton.classList.remove('off');
}

// Function to stop the camera
function stopCamera() {
    isLoading = true;
    if (camera) {
        camera.stop();
        camera = null;
    }
    if (faceDetection){
        faceDetection.close();
    }
    toggleButton.textContent = 'Turn On Camera';
    toggleButton.classList.add('off');
    drawLoadingCircle();
}

// Toggle button functionality
toggleButton.addEventListener('click', () => {
    if (camera) {
        stopCamera();
    } else {
        startCamera();
    }
});

function mostCommon(arr) {
    // Create a Map to count occurrences
    const counter = new Map();

    // Count occurrences of each element
    arr.forEach(element => {
        counter.set(element, (counter.get(element) || 0) + 1);
    });

    // Determine the maximum count
    let maxCount = 0;
    counter.forEach(count => {
        if (count > maxCount) {
            maxCount = count;
        }
    });

    // Get all elements with the maximum count
    let mostCommonElements = [...counter.entries()]
        .filter(([_, count]) => count === maxCount)
        .map(([element]) => element);

    if (mostCommonElements.length > 1){
        mostCommonElements = mostCommonElements[1];
    }
    return String(mostCommonElements);
}


function drawLoadingCircle() {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const pixelRatio = 1;

    // Set the canvas resolution (high-DPI support)
    canvasElement.width = videoWidth * pixelRatio;
    canvasElement.height = videoHeight * pixelRatio;
    canvasElement.style.width = `${videoWidth}px`;
    canvasElement.style.height = `${videoHeight}px`;
    
    // Scale the drawing context to account for pixel ratio
    canvasCtx.scale(pixelRatio, pixelRatio);
    
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear canvas before drawing

    canvasCtx.beginPath();  
    canvasCtx.arc(canvasElement.width / 2, canvasElement.height / 2, radius, startAngle, startAngle + Math.PI / 2); // Draw a quarter circle
    canvasCtx.lineWidth = 5;
    canvasCtx.strokeStyle = 'blue';
    canvasCtx.stroke();

    canvasCtx.font = "15px Times New Roman";
    canvasCtx.fillStyle = 'black';
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.fillText("Loading", canvasElement.width / 2, canvasElement.height / 2);

    // Update the angle to simulate rotation
    startAngle += 0.1; // Adjust this value to control speed
    if (startAngle >= Math.PI * 2) {
      startAngle = 0;
    }

    if (isLoading) {
        // Call the drawLoadingCircle function again to create an animation loop
        requestAnimationFrame(drawLoadingCircle);
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Retrieve user inputs for name, gender, and age
    const name = input_name.value;
    const gender = input_gender.value;
    const age = selectBox.value;
    const height = input_height.value;
    const weight = input_weight.value;
    let level;
    for (i = 0; i < input_level.length; i++) {
        if (input_level[i].checked){
            level = input_level[i].value;
        }
    }

    // Send the face data, name, gender, and age to the worker
    if (face && name && gender && age) {
        const canvas_1 = document.createElement('canvas');
        const context_1 = canvas_1.getContext('2d');
        canvas_1.width = face.width;
        canvas_1.height = face.height;
        context_1.putImageData(face, 0, 0);
        const imageBase64 = canvas_1.toDataURL('image/jpeg', 1.0);

        worker.postMessage({ type: 'put2DB', image64: imageBase64 , age_db: age, gender_db: gender, name_db: name, height_db: height, weight_db: weight, level_db: level});
    } else {
        console.log('Missing data not detected.');
    }
});
