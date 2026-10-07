from fastapi import FastAPI, File, UploadFile

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello":"world"}

@app.post("/predict")
def predict_fruit(image: UploadFile):
    print("Predicting fruit from file: " + image.filename)
    return {"label":"apple","confidence": 0.94}
