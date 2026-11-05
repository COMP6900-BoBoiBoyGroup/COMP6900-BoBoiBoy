from fastapi import FastAPI, File, UploadFile
from model.two_stage_inference import predict_image

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
            "confidence": 0.0,
            "ripe": "",
            "ripe_confidence": ""
    }
    print(prediction)

    # Convert the Top Probability to a float
    # Thank you https://stackoverflow.com/a/12432693 for the method
    fruit_confidence_float = prediction["Top Probability"].strip().strip("%")
    fruit_confidence_float = float(fruit_confidence_float) / 100


    # Re-format the prediction into a result that the frontend can use
    if (prediction["Status"][:7] == "Unknown"):
        result.update({"label": "unknown"})
    else:
        result.update({"label": prediction["Status"]})
    result.update({"confidence": fruit_confidence_float})

    # If a banana is identified, also return ripeness:
    if (prediction["Status"][:6] == "banana"):

        # Do the same conversion for Ripeness probability
        ripe_confidence_float = prediction["Ripeness Probability"].strip().strip("%")
        ripe_confidence_float = float(ripe_confidence_float) / 100

        # Re-format the ripeness label
        ripe_label = "Unknown"
        if (prediction["Ripeness"] == "ripe"):
            ripe_label = "Ripe"
        elif (prediction["Ripeness"] == "overripe"):
            ripe_label = "Over Ripe"
        elif (prediction["Ripeness"] == "rotten"):
            ripe_label = "Rotten"
        elif (prediction["Ripeness"] == "unripe"):
            ripe_label = "Not Ripe"

        # Include Ripeness into the result
        result.update({"ripe": ripe_label})
        result.update({"ripe_confidence": ripe_confidence_float})
    return result
    

