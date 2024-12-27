from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from qdrant_client.models import VectorParams, Distance, PointStruct
import os
import numpy as np

load_dotenv("../backend/weights/.env")

level_up = {"Beginner": "Normal", "Normal": "Advanced", "Advanced": "Advanced"}

level_down = {"Advanced": "Normal", "Normal": "Beginner", "Beginner": "Beginner"}

dic_fatigue = {"Very Light": 0, "Light": 1, "Moderate": 2, "Quite Tired": 3, "Very Tired": 4, "Extremely Tired": 5}
dic_diff = {"Easy": 0, "Normal": 1, "Hard": 2}

qclient = QdrantClient(
    url=os.getenv("QDRANT_DB_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# recreate collection
collection_name = "face_db"
collection = qclient.recreate_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size = 128,
        distance=Distance.COSINE
    )
)
# Verify
def verify(embedding, lower_threshold=0.3, upper_threshold=0.7, limit=1):
    try:
        # Perform search
        result = qclient.search(
            collection_name=collection_name,
            query_vector=embedding,
            limit=limit,
            with_payload=True,
            with_vectors=True
        )[0].score
        if not result:
            print("No results found.")
            save_face_data(np.random.rand(128), {"type": "dummy"})
            return False
        if result < lower_threshold:
            print(f"Result is not human enough: {result}")
            return True
        return result > upper_threshold
    except Exception as e:
        print(f"An error occurred during the search: {e}")
        return False

def load_face_data(query_vector):
    search_result = qclient.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=1,
        with_payload=True,
        with_vectors=False
    )[0].payload
    if not search_result:
        return None
    else:
        id = search_result["id"]
        name_label = search_result["name"]
        gender_label = search_result["gender"]
        age_label = search_result["age"]
        # height_label = search_result["height"]
        # weight_label = search_result["weight"]
        level_label = search_result["level"]
        bmi_label = search_result["bmi"]
        return id, name_label, gender_label, age_label, level_label, bmi_label
    
# Put to DB
def save_face_data(vector, payload):
    # Query for the vector with the highest ID (assuming IDs are integers)
    points = qclient.scroll(collection_name=collection_name, offset=None, limit=7, with_vectors=False)

    last_id = points[0][-1].id if points[0] else None
    print(f"The last ID is: {last_id}")

    if last_id == None:
        count_id = 1
    else:
        count_id = last_id + 1

    payload['id'] = count_id

    record = models.Record(
        id = count_id,
        payload=payload,
        vector=vector
    )
    qclient.upload_records(
        collection_name=collection_name,
        records=[record]
    )

    return count_id

def update_db(point_id, payload):

    existing_point = qclient.retrieve(
        collection_name=collection_name,
        ids = [int(point_id)],
        with_vectors=True
    )

    check_payload = existing_point[0].payload

    key = [key for key in payload.keys()]

    if key[0] in check_payload:
        
        fatigue_pl, diff_pl =  payload[key[0]].split("-")
        fatigue_ep, diff_ep =  check_payload[key[0]].split("-")

        if (dic_fatigue[fatigue_pl] < dic_fatigue[fatigue_ep] and dic_diff[diff_pl] <= dic_diff[diff_ep]) or (dic_diff[diff_pl] < dic_diff[diff_ep] and dic_fatigue[fatigue_pl] <= dic_fatigue[fatigue_ep]):
            print("-----True-----")
            check_payload['level'] = level_up[check_payload['level']]
        elif (dic_fatigue[fatigue_pl] > dic_fatigue[fatigue_ep] and dic_diff[diff_pl] >= dic_diff[diff_ep]) or (dic_diff[diff_pl] > dic_diff[diff_ep] and dic_fatigue[fatigue_pl] >= dic_fatigue[fatigue_ep]):
            print("-----True-----")
            check_payload['level'] = level_down[check_payload['level']]

    updated_payload = {**check_payload, **payload}

    qclient.upsert(
        collection_name=collection_name,
        points=[
            PointStruct(
                id=int(point_id),
                vector=existing_point[0].vector,
                payload=updated_payload      
            )
        ]
    )


    