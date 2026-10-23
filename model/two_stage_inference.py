import os
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(MODEL_DIR, "weights")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Preprocessing transform
inference_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

UNKNOWN = "Unknown / Neither Apple or Banana"

def load_resnet(path):

    # Initialize the base model architecture first
    try:
        weights = models.ResNet18_Weights.IMAGENET1K_V1
        model = models.resnet18(weights=weights)
    except Exception:
        model = models.resnet18(pretrained=True)

    try:
        checkpoint = torch.load(path, map_location=device, weights_only=False)
    except TypeError:
        checkpoint = torch.load(path, map_location=device)

    classes = checkpoint["classes"]
    num_classes = len(classes)

    # Adjust the final fully connected layer of ResNet18
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    # Load the state weights
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, classes

def ripe_checkpoint():
    for name in ("resnet18_banana_ripeness.pth", "banana_resnet18.pth"):
        path = os.path.join(WEIGHTS_DIR, name)
        if os.path.isfile(path):
            return path
    raise FileNotFoundError(
        "Put resnet18_banana_ripeness.pth in model/weights."
    )

fruit_model, fruit_classes = load_resnet(os.path.join(WEIGHTS_DIR, "best_resnet18.pth"))
ripe_model, ripe_classes = load_resnet(ripe_checkpoint())

def run_model(model, classes, image):
    tensor = inference_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
        energy = -torch.logsumexp(logits, dim=1).item()
        top_prob, pred_idx = torch.max(probs, dim=0)
    return classes[pred_idx.item()], top_prob.item(), energy, probs

def predict_image(image_source, conf_threshold = 0.90, energy_threshold= -1.3584):
    img = Image.open(image_source).convert("RGB")

    # Stage 1
    label, prob, energy, probs = run_model(fruit_model,fruit_classes,img)
    if prob < conf_threshold or energy > energy_threshold:
            label = UNKNOWN
    
    results = {
        "Status": label,
        "Top Probability": f"{prob * 100:.2f}% ",
        "Energy Score": f"{energy:.4f}",
        "Detailed Probabilities": {
            fruit_classes[i]: f"{probs[i].item() * 100:.2f}%"
            for i in range(len(fruit_classes))
        },
    }


    # Stage 2 
    if label.strip().lower() != "banana":
        return results

    ripe_label, ripe_prob, _, ripe_probs = run_model(
            ripe_model, ripe_classes, img
        )
    results["Ripeness"] = ripe_label
    results["Ripeness Probability"] = f"{ripe_prob * 100:.2f}% "
    results["Ripeness Probabilities"] = {
        ripe_classes[i]: f"{ripe_probs[i].item() * 100:.2f}%"
        for i in range(len(ripe_classes))
    }
    return results