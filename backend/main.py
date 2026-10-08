from fastapi import FastAPI, File, UploadFile
from ..model.model_inference import predict_image

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello":"world"}

@app.post("/predict")
def predict_fruit(image: UploadFile):
    response = predict_image_wrapper(image.file)
    return response

# This function contains code purely for interacting with the model, separated
#    from the function predict_fruit that purely interacts with frontend
def predict_image_wrapper(image_file):
    # Use the model to predict the image
    prediction = predict_image(image_file)
    result = {
            "label": "",
            "confidence": 0.0
    }

    # Convert the Top Probability to a float
    # Thank you https://stackoverflow.com/a/12432693 for the method
    confidence_float = prediction["Top Probability"].strip().strip("%")
    confidence_float = float(confidence_float) / 100

    # Re-format the prediction into a result that the frontend can use
    if (prediction["Status"][:7] == "Unknown"):
        result.update({"label": "unknown"})
    else:
        result.update({"label": prediction["Status"]})
    result.update({"confidence": confidence_float})
    return result
    

