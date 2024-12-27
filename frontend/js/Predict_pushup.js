async function check_pushup(imageTensor, landmarks, angles) {

    const classLabels = ["correct_up", "incorrect_up", "correct_down", "incorrect_down"];

    // Load the ONNX model
    const session = await ort.InferenceSession.create('../model/MobileNet.onnx');

    // Preprocess the image using TensorFlow.js
    let imgPre = imageTensor
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0);

    imgPre = imgPre.reshape([1, 224, 224, 3]);

    const imgArray = imgPre.dataSync();
    
    const inputs = {
        'image_input': new ort.Tensor('float32', imgArray, [1, 224, 224, 3]), 
        'landmark_input': new ort.Tensor("float32", new Float32Array(landmarks), [1, landmarks.length]),
        'angles_input': new ort.Tensor("float32", new Float32Array(angles), [1, angles.length]),
    };

    const output = await session.run(inputs);

    const ar = Array.from(output.dense_3.cpuData);

    const maxIndex = ar.indexOf(Math.max(...ar));

    const predictedLabel = classLabels[maxIndex];

    return predictedLabel
}