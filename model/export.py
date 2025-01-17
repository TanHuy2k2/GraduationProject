from ultralytics import YOLO

# Load a model
model = YOLO("yolo11n-pose.pt")  # load an official model

# Export the model
model.export(format="openvino", half = True, imgsz = 320)