from fastapi import FastAPI, File, UploadFile

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello":"world"}

@app.post("/predict")
def predict_fruit(file: UploadFile):
    print("Predicting fruit from file: " + file.filename)
    return {"label":"pineapple","confidence": 0.94}
