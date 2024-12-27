let bmi;
// Listen for messages from the main thread
onmessage = async function(e) {
    const { type, name_db, gender_db, age_db, height_db, weight_db, level_db, 
        image64, bmi_label, point_id, exercise_db, form_db } = e.data;

    if (type === 'checkFace') {
        // Perform face check
        const response = await fetch('http://localhost:2000/checkface', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image64 })
        });

        const result = await response.json();
        postMessage({ type: 'checkFaceResult', result });

    } else if (type === 'put2DB') {

        bmi_score = parseInt(weight_db) / (parseFloat(height_db/100)**2)

        console.log("BMI: ",bmi_score);

        if (bmi_score < 18.5){
            bmi = "Underweight"
        }
        else if (bmi_score < 24.9){
            bmi = "Normal"
        }
        else{
            bmi = "Overweight"
        }

        // Save data to database
        const response = await fetch('http://localhost:2000/put2DB', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image64, name: name_db, gender: gender_db, age: age_db, height: height_db, weight: weight_db, level: level_db, bmi: String(bmi) })
        });

        const result = await response.json();
        postMessage({ type: 'put2DBResult', result });
    }else if (type === "update_inf"){
        // Save data to database
        const response = await fetch('http://localhost:2000/update_inf', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ point_id, exercise_db, form_db})
        });

        const result = await response.json();
        postMessage({ type: 'update', result });

    }else if (type === "get_exercise_1"){
        // Save data to database
        const response = await fetch('http://localhost:2000/get_exercise_1', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gender: gender_db, age: age_db, level: level_db, bmi: bmi_label })
        });

        const result = await response.json();
        console.log("1: ", result)
        postMessage({ type: 'getEX_1', result });

    }else if (type === "get_exercise_2"){
        // Save data to database
        const response = await fetch('http://localhost:2000/get_exercise_2', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gender: gender_db, age: age_db, level: level_db})
        });

        const result = await response.json();
        console.log("2: ", result)
        postMessage({ type: 'getEX_2', result });

    }else if (type === "get_exercise_3"){
        // Save data to database
        const response = await fetch('http://localhost:2000/get_exercise_3', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gender: gender_db, age: age_db, level: level_db, bmi: bmi_label})
        });

        const result = await response.json();
        console.log("3: ", result)
        postMessage({ type: 'getEX_3', result });

    }
};
