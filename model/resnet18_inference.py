import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# --- Load the trained model and setup for prediction ---
# Initialize ResNet18 model to match our saved checkpoint
try:
    weights = models.ResNet18_Weights.IMAGENET1K_V1
    model = models.resnet18(weights=weights)
except Exception:
    model = models.resnet18(pretrained=True)

# Model configuration and Initialisation
BEST_CKPT = "/content/best_model.pth"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the best checkpoint to discover metadata
try:
    checkpoint = torch.load(BEST_CKPT, map_location=device, weights_only=False)
except TypeError:
    checkpoint = torch.load(BEST_CKPT, map_location=device)

classes = checkpoint["classes"]
class_to_idx = checkpoint["class_to_idx"]
num_classes = len(classes)

# Adjust the final fully connected layer of ResNet18
in_features = model.fc.in_features
model.fc = nn.Linear(in_features, num_classes)

# Load the state weights
model.load_state_dict(checkpoint["model_state_dict"])
model = model.to(device)
model.eval()

# Preprocessing transform
inference_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# Prediction function
def predict_image(image_path: str, conf_threshold: float = 0.90, energy_threshold: float = -4.7):
  img = Image.open(image_path).convert("RGB")
  # Preprocess: adds batch dimension --> Shape: (1,3,224,224)
  tensor = inference_transform(img).unsqueeze(0).to(device)

  with torch.no_grad():
    logits = model(tensor)
    probs = torch.softmax(logits, dim=1)[0]
    energy = -torch.logsumexp(logits, dim=1).item()

    top_prob, pred_idx = torch.max(probs, dim=0)
    top_prob = top_prob.item()
    pred_idx = pred_idx.item()
    #Not using the energy threshold
  #if top_prob < conf_threshold or energy > energy_threshold:
  #  result_label = "Unknown / Neither Apple or Banana"
  #else:
  #  result_label = classes[pred_idx]
  result_label = classes[pred_idx]
  # Display results in console
  results = {
      "Status": result_label,
      "Top Probability": f"{top_prob * 100:.2f}% ",
      "Energy Score": f"{energy:.4f}",
      "Detailed Probabilities": {classes[i]: f"{probs[i].item() * 100:.2f}%" for i in range(num_classes)}
  }

  return results