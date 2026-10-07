# Fruit - apple/banana CNN (`model/`)

Custom convolutional network that classifies a photo as **apple** or **banana**. Images that are neither fruit are rejected with an energy score and a confidence cutoff, and returned as  `Unknown / Neither Apple or Banana`.

This folder is the model piece of the COMP6900 fruit identifier. The checkpoin, training notebook, and evaluation plots live here. The web UI live in `frontend/`.

## Layout
```
model/
    model_inference.py                   Load the checkpoint and classify one image
    requirement.txt.                     Python packages for inference
    weights
        /best_custom_cnn.pth             Best validation checkpoint (~1.0M parameters)
    scripts/
        custom_cnn_training.ipynb        Colab notebook - download data, train, evaluate, test enviroment for model inference
    results/
        training_curves.png              Train/validation loss and accuracy
        confusion_matrix.png             Validation confusion matrix
        test_confusion_matrix.png        Held-out test confusion matrix
```

## Inference

Install the inference packages, then run from the **repository root**. `model_inference.py` loads `model/weights/best_custom_cnn.pth` relative to that root, so the working directory has to be the repo, not `model/`.

```bash
pip install -r model/requirement.txt
python -c "from model.model_inference import perdict_image; print(predict_image('path/to/photo,jpg))"
```

`predict_image` return a dict:

| Key | Meaning |
| --- | ------- |
| `Status` | `apple`, `banana`, or `Unknown / Neither Apple or Banana` |
| `Top Probability` | Softmax probability of the wining class|
| `Energy Score` |  \(-\mathrm{logsumexp}(\mathrm{logits})\). More negative means the image looks more like the training distribution|
| `Detailed Probabilities` | Per-class softmax percentages|

A prediction is accepted only when the probability is at least **0.90** and the energy score is at most **-4.7**. Anything esle is lablled unknown. Those defaults are the arguments `conf_threshold` and `energy_threshold`.

Preprocessing matches validation: resize to 256, center-crop to 224, then ImageNet normalization (`mean = [0.485, 0.456, 0.406]`, `std = [0.229, 0.224, 0.225]`). The checkpoint also stores `classes` and `class_to_idx`, which inference reads so the label order stays tied to the saved weights.

CPU works. CUDA is used when it is available.


