import cv2
import numpy as np
from PIL.Image import open
from tensorflow.keras.models import load_model
model = load_model("Model_multimodal_aug")
Classes = ["Normal", "Diabetic Retinopathy", "Glaucoma", "Cataract", "AMD", "Hypertension", "Myopia", "Other"]

def generate_clipping_mask(image, tolerance=6):
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clipping_mask = (image > tolerance).astype(np.uint8)
    return clipping_mask

def extract_region(image, mask):
    x, y, w, h = cv2.boundingRect(mask)
    rgb_reg = image[y:y+h, x:x+w]
    return rgb_reg

def preprocess(file):
    img = open(file)
    img = np.array(img)
    image = img.copy()
    
    mask = generate_clipping_mask(img)
    extracted_region = extract_region(image, mask)
    cropped_region = cv2.resize(extracted_region, (224, 224))
    
    channels = cv2.split(cropped_region)
    
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    for i in range(len(channels)):
        channels_list = list(channels)
        channels_list[i] = clahe.apply(channels_list[i])
        channels = tuple(channels_list)
        
    # Merge channels
    clahe_rgb_image = cv2.merge(channels)
    
    median = cv2.medianBlur(clahe_rgb_image, 3)    
    
    return median

def predict(left, right, age, sex):
    sex = sex = 1 if sex =="Male" else 0

    data = (np.expand_dims(np.array(left), axis=0), 
        np.expand_dims(np.array(right), axis=0), 
        np.expand_dims(age, axis=0), 
        np.expand_dims(sex, axis=0))
    
    preds = model.predict(data)

    predictions = {}
    for clas, conf in zip(Classes, preds[0]):
        predictions[clas] = np.float64(conf)
        
#     For testing purpose
#     predictions = {
#     'Normal': np.float64(0.0930203),
#     'Diabetic Retinopathy': np.float64(0.16516417),
#     'Glaucoma': np.float64(0.009961562),
#     'Cataract': np.float64(0.003354868),
#     'AMD': np.float64(0.05954609),
#     'Hypertension': np.float64(0.0006778725),
#     'Myopia': np.float64(0.0947747),
#     'Other': np.float64(0.57350045)
# }

    return predictions