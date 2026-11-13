# Fruit identifier models (`model/`)

This folder holds the model side of the COMP6900 fruit identifier: training notebooks, trained checkpoints, inference code, evaluation plots and model tests. The web UI lives in `frontend/` and the API in `backend/`.

Three models were trained:

| Model | Task | Classes | Checkpoint | Used in production |
| --- | --- | --- | --- | --- |
| Custom CNN | Fruit type | `apple`, `banana` | `weights/best_custom_cnn.pth` (~1.0M params) | No (original baseline) |
| ResNet18 (transfer learning) | Fruit type | `apple`, `banana` | `weights/best_resnet18.pth` | Yes (stage 1) |
| ResNet18 (transfer learning) | Banana ripeness | `overripe`, `ripe`, `rotten`, `unripe` | `weights/resnet18_banana_ripeness.pth` | Yes (stage 2) |

The backend (`backend/main.py`) calls `predict_image` from `two_stage_inference.py`. That function classifies the fruit first, then, if the fruit is a banana, predicts how ripe it is.

## Layout
```
model/
    two_stage_inference.py               Production inference: fruit ResNet18, then banana ripeness ResNet18
    model_inference.py                   Inference for the custom CNN (baseline)
    resnet18_inference.py                Colab version of ResNet18 inference (loads /content/best_model.pth)
    requirement.txt                      Python packages for inference (CPU-only torch)
    weights/
        best_custom_cnn.pth              Custom CNN, best validation checkpoint
        best_resnet18.pth                ResNet18 apple/banana, best validation checkpoint
        resnet18_banana_ripeness.pth     ResNet18 banana ripeness, best validation checkpoint
    scripts/
        custom_cnn_training.ipynb                       Colab: download data, train and evaluate the custom CNN
        Train_ResNet18_model.ipynb                      Colab: fine-tune ResNet18 on apple/banana
        Banana_Classification_ResNet18_model.ipynb      Colab: fine-tune ResNet18 on banana ripeness
    results/
        training_curves.png, confusion_matrix.png, test_confusion_matrix.png                       Custom CNN
        resnet18_training_curves.png, resnet18confusion_matrix.png, resnet18_test_confusion_matrix.png   ResNet18 apple/banana
        banana_training_curves.png, banana_confusion_matrix.png, banana_test_confusion_matrix.png   ResNet18 ripeness
    tests/
        modelTestCase.ipynb              Model test cases 1-7
        images/                          Test images (apples, bananas, dark versions, ripeness samples)
```

## Datasets

Both datasets were built on Roboflow and exported in folder format (`train/`, `valid/`, `test/`, with one subfolder per class). Copies of the exports are committed in `dataset/` through Git LFS:

| Archive | Roboflow project | Train | Valid | Test | Total |
| --- | --- | --- | --- | --- | --- |
| `dataset/Fruit_Classification.folder.zip` | [BoBoiBoy's CNN Project](https://universe.roboflow.com/c3423667-uon-edu-au/boboiboy-s-cnn-project) | 4,980 | 623 | 622 | 6,225 |
| `dataset/Banana_Ripeness_Classification.v1i.folder.zip` | [Banana Ripeness Classification](https://universe.roboflow.com/c3423667-uon-edu-au/banana-ripeness-classification-unqgs) | 4,493 | 562 | 561 | 5,616 |

Per-class counts:

- **Fruit:** apple 2,493 / 296 / 330, banana 2,487 / 327 / 292 (train / valid / test).
- **Ripeness:** overripe 891 / 121 / 113, ripe 1,351 / 163 / 153, rotten 1,537 / 191 / 185, unripe 714 / 87 / 110 (train / valid / test).

Both datasets are licensed CC BY 4.0.

To get the data after cloning, install [Git LFS](https://git-lfs.com) first. Otherwise the zips download as small pointer files:

```bash
git lfs install
git lfs pull
unzip dataset/Fruit_Classification.folder.zip -d dataset/fruit
unzip dataset/Banana_Ripeness_Classification.v1i.folder.zip -d dataset/banana_ripeness
```

The notebooks download the same data straight from Roboflow with the `roboflow` package. To train from the zips instead, point `DATA_ROOT` in the notebook at the unzipped folder.

## Training

All three notebooks were run on Google Colab and share the same pipeline:

- **Augmentation (train only):** random horizontal and vertical flip, random rotation of 15 degrees, `RandomResizedCrop(224, scale=(0.8, 1.0))`, then ImageNet normalisation.
- **Validation and test preprocessing:** resize to 256, center-crop to 224, ImageNet normalisation (`mean = [0.485, 0.456, 0.406]`, `std = [0.229, 0.224, 0.225]`).
- **Optimiser and scheduler:** AdamW with `CosineAnnealingLR`, batch size 32.
- **Checkpointing:** the epoch with the best validation accuracy is saved, together with `classes` and `class_to_idx` so the label order at inference matches training.

| Model | Epochs | Learning rate | Best val accuracy | Test accuracy |
| --- | --- | --- | --- | --- |
| Custom CNN | 30 | 2e-4 | 99.20% | 97.75% (622 images) |
| ResNet18 apple/banana | 5 | 1e-5 | 100.00% | 100.00% (622 images) |
| ResNet18 banana ripeness | 20 | 1e-4 | 98.75% | 99.29% (561 images) |

**Custom CNN architecture:** five blocks of Conv2d (3x3), BatchNorm, ReLU and MaxPool (32, 64, 128, 256, 256 channels), global average pooling, then Dropout(0.4), Linear(256, 128), ReLU, Dropout(0.2), Linear(128, 2). Convolutions use Kaiming initialisation.

**ResNet18 models:** start from ImageNet weights (`ResNet18_Weights.IMAGENET1K_V1`), replace the final `fc` layer with one sized to the number of classes, and fine-tune every layer.

## Inference

Install the packages, then run from the **repository root**. Checkpoints are loaded relative to `model/`, but the imports use the `model.` package path:

```bash
pip install -r model/requirement.txt
python -c "from model.two_stage_inference import predict_image; print(predict_image('model/tests/images/ripe.jpeg'))"
```

### Two-stage inference (`two_stage_inference.py`)

`predict_image(image_source, conf_threshold=0.90, energy_threshold=-1.3584)` accepts a file path or a file-like object. The backend passes the uploaded file directly.

1. **Stage 1, fruit type:** the ResNet18 apple/banana model runs on the image. The result is replaced with `Unknown / Neither Apple or Banana` when the top probability is below `conf_threshold` or the energy score is above `energy_threshold`. The energy threshold of -1.3584 is the 95th percentile of validation-set energy scores.
2. **Stage 2, ripeness:** runs only when stage 1 returns `banana`. The ripeness model adds its prediction to the result. Stage 2 has no unknown cutoff.

Returned dict:

| Key | Meaning |
| --- | ------- |
| `Status` | `apple`, `banana`, or `Unknown / Neither Apple or Banana` |
| `Top Probability` | Softmax probability of the winning fruit class, e.g. `"99.87% "` |
| `Energy Score` | \(-\mathrm{logsumexp}(\mathrm{logits})\). More negative means the image looks more like the training data |
| `Detailed Probabilities` | Per-class softmax percentages for apple and banana |
| `Ripeness` | Bananas only: `overripe`, `ripe`, `rotten`, or `unripe` |
| `Ripeness Probability` | Bananas only: softmax probability of the winning ripeness class |
| `Ripeness Probabilities` | Bananas only: per-class ripeness percentages |

The backend then reduces this to the JSON the frontend expects (see the root `README.md`).

### Custom CNN (`model_inference.py`)

`predict_image(image_path)` returns the same first four keys. The confidence/energy check that would return `Unknown` is commented out in the current code, so this model always returns `apple` or `banana`.

CPU is enough for inference. CUDA is used when it is available.

## Tests

`tests/modelTestCase.ipynb` covers the following. Cases 1-6 use the custom CNN (`model_inference.py`), and case 7 uses `two_stage_inference.py`:

1. Normal apple images
2. Normal banana images
3. Different resolutions
4. Low-light apples at 40% brightness
5. Output dict has the expected keys
6. Probabilities fall between 0% and 100%
7. Ripeness is predicted only for bananas, and is correct for the unripe, ripe, overripe and rotten samples

Start the notebook from `model/tests/` so the relative `images/` paths resolve, with the repo root on `PYTHONPATH` so `from model...` imports work:

```bash
cd model/tests
PYTHONPATH=../.. jupyter notebook modelTestCase.ipynb
```
