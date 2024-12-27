async function predict(imageTensor) {
    // Load the ONNX model
    const session = await ort.InferenceSession.create('../model/MobileNetV3L_2.onnx');

    // Preprocess the image using TensorFlow.js
    let imgPre = imageTensor
        .resizeNearestNeighbor([200, 200]) // Resize the image to 200x200
        .toFloat()
        .div(255.0);

    // Reshape the tensor to [1, 200, 200, 3]
    imgPre = imgPre.reshape([1, 200, 200, 3]);

    // Convert TensorFlow.js tensor to a flat array
    const imgArray = imgPre.dataSync(); // Get the data in a flat array

    // Prepare ONNX Runtime input
    const inputTensor = new ort.Tensor('float32', imgArray, [1, 200, 200, 3]);

    // Run inference
    const output = await session.run({ 'input_1': inputTensor });

    const ageTensor = output.age_output;
    const genderTensor = output.gender_output;

    const get_age = ageTensor.data[0];
    const get_gender = genderTensor.data[0];

    const age = Math.round(Number(get_age));
    const gender = Math.round(Number(get_gender));

    const [genderRes, ageRes] = await Promise.all([
        fetch('../model/dic_labels_gender.json'),
        fetch('../model/dic_labels_age.json')
    ]);
    
    const labelsGender = await genderRes.json();
    const labelsAge = await ageRes.json();

    // Get the predicted labels
    const gender_predict = labelsGender[String(gender)] || 'Unknown';
    const age_predict = labelsAge[String(age)] || 'Unknown';

    // Return the predictions
    return [age_predict, gender_predict ];
}