import pandas as pd
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
import joblib
from os import path as _os_path

ps = PorterStemmer()

def clean_disease_file(_diseases_dataset):
    _diseases_dataset["tags"] = _diseases_dataset[["Symptoms", "Specialization", "Location"]].apply(
        lambda row: ",".join([str(v).strip().lower().replace(" ", "") for v in row if v != ""]),
        axis=1
    )
    return _diseases_dataset

def stem(text):
    return " ".join([ps.stem(w) for w in text.split()])

# 📌 Get absolute path relative to this file
BASE_DIR = _os_path.dirname(_os_path.abspath(__file__))

# Load dataset
data_path = _os_path.join(BASE_DIR, "sample_data", "Gwalior_Doctors_List.xlsx")
df = pd.read_excel(data_path)
df = clean_disease_file(df)
df["tags"] = df["tags"].apply(stem)

# Train vectorizer
count_vector = CountVectorizer(max_features=5000, stop_words="english")
vectors = count_vector.fit_transform(df["tags"]).toarray()

# Save artifacts
joblib.dump(df, BASE_DIR + "/model_data.pkl")
joblib.dump(count_vector, BASE_DIR+"/vectorizer.pkl")
joblib.dump(vectors, BASE_DIR + "/vectors.pkl")

print("✅ Model artifacts saved")
