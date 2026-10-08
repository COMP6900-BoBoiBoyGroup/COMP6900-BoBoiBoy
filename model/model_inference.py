# Extra libraries for backend
import os

# Import required libraries
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# Define the model inference class
class CustomFruitCNN(nn.Module):
  def __init__(self, num_classes, dropout_rate=0.4):
    super().__init__()

    # Input: (Batch, 3, 224, 224)
    self.features = nn.Sequential(
        # Block 1 -> (B,32,112,112)
        nn.Conv2d(3,32, kernel_size=3, stride=1, padding=1, bias=False),
        nn.BatchNorm2d(32),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(kernel_size=2, stride=2),
        # Block 2 -> (B,64,56,56)
        nn.Conv2d(32,64, kernel_size=3, stride=1, padding=1, bias=False),
        nn.BatchNorm2d(64),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(kernel_size=2, stride=2),
        # Block 3 -> (B,128,28,28)
        nn.Conv2d(64,128, kernel_size=3, stride=1, padding=1, bias=False),
        nn.BatchNorm2d(128),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(kernel_size=2, stride=2),
        # Block 4 -> (B,256,14,14)
        nn.Conv2d(128,256, kernel_size=3, stride=1, padding=1, bias=False),
        nn.BatchNorm2d(256),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(kernel_size=2, stride=2),
        # Block 5 -> (B,256,7,7)
        nn.Conv2d(256,256, kernel_size=3, stride=1, padding=1, bias=False),
        nn.BatchNorm2d(256),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(kernel_size=2, stride=2),

        # Global Average Pooling -> (B, 256, 1, 1)
        # Squeezing (7x7) into one 256-number vector per image.
        nn.AdaptiveAvgPool2d((1,1))

    )

    # Classifier flattern the vector above, randomly drops some neurons, model does not memorise the training set
    # End with linear layer that outputs one score per class
    self.classifier = nn.Sequential(
        nn.Flatten(),
        nn.Dropout(dropout_rate),
        nn.Linear(256, 128),
        nn.ReLU(inplace=True),
        nn.Dropout(p=dropout_rate/2),
        nn.Linear(128, num_classes)
    )

    self._init_weights()
  # Set starting weights: Kaiming initalisation for convolutions
  def _init_weights(self):
    for m in self.modules():
      if isinstance(m, nn.Conv2d):
        nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
      elif isinstance(m, nn.BatchNorm2d):
        nn.init.constant_(m.weight, 1.0)
        nn.init.constant_(m.bias, 0.0)
      elif isinstance(m, nn.Linear):
        nn.init.normal_(m.weight, 0.0, 0.01)
        nn.init.constant_(m.bias, 0.0)

  def forward(self, x):
    x = self.features(x)
    return self.classifier(x)

# Check current working directory is in /model. Otherwise, change it
original_cwd = ""
if (os.getcwd()[-5:] != "model"):
    original_cwd = os.getcwd()
    os.chdir("../model")  
    # The original cwd is saved, to change back to it later

# Model configuration and initialisation
BEST_CKPT = "weights/best_custom_cnn.pth"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load metadata from the model checkpoint
try:
  checkpoint = torch.load(
      BEST_CKPT, map_location=device, weights_only=False
  )
except TypeError:
  checkpoint = torch.load(BEST_CKPT, map_location=device)

classes = checkpoint["classes"]
class_to_idx = checkpoint["class_to_idx"]
num_classes = len(classes)

# Initialise the model and load the trained weights
model = CustomFruitCNN(num_classes=len(classes)).to(device)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

# Preprocessing transform for input images
inference_transform = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)

# If the original_cwd is set, then change back to it
if (original_cwd != ""):
    os.chdir(original_cwd)

# Prediction function
def predict_image(image_path: str, conf_threshold: float = 0.90, energy_threshold: float = -4.7):
  img = Image.open(image_path).convert("RGB")
  # Preprocess: adds batch dimension --> Shape: (1,3,224,224)
  tensor = inference_transform(img).unsqueeze(0).to(device)

  with torch.no_grad():
    logits = model(tensor)
    probs = torch.softmax(logits, dim=1)[0]
    # Calculate energy score using log-sum-exp trick
    energy = -torch.logsumexp(logits, dim=1).item()
    # Get the top predicted class and its probability
    top_prob, pred_idx = torch.max(probs, dim=0)
    top_prob = top_prob.item()
    pred_idx = pred_idx.item()
  # Determine the result label based on confidence and energy thresholds
  if top_prob < conf_threshold or energy > energy_threshold:
    result_label = "Unknown / Neither Apple or Banana"
  else:
    result_label = classes[pred_idx]

# Display results in console
  results = {
      "Status": result_label,
      "Top Probability": f"{top_prob * 100:.2f}% ",
      "Energy Score": f"{energy:.4f}",
      "Detailed Probabilities": {classes[i]: f"{probs[i].item() * 100:.2f}%" for i in range(num_classes)}
  }

  return results
