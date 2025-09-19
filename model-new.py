import numpy as np
import pandas as pd
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def clean_disease_csv(_diseases_dataset):
  _diseases_dataset_new = _diseases_dataset.apply(lambda col: col.map(lambda v: col.name if v == 1 else ("" if v == 0 else v)))
  _diseases_dataset_new["tags"] = _diseases_dataset_new.apply(
    lambda row: ",".join([str(v).strip().lower().replace(" ", "") for v in row if v != ""]),
    axis=1
  )
  return _diseases_dataset_new

# ------
def stem(text):
  y = []
  for i in text.split():
    y.append(ps.stem(i))
  return " ".join(y)


def preprocess_text(text):
    """Apply same cleaning steps as dataset"""
    text = text.lower().replace(" ", "")  # remove spaces like dataset
    return stem(text)

def find_disease_by_symptoms(symptoms, top_n=5):
    # clean input symptoms same way as dataset tags
    symptoms = preprocess_text(symptoms)
    
    # convert into vector
    symptoms_vector = _count_vector.transform([symptoms]).toarray()
    
    # cosine similarity with all disease tags
    distances = cosine_similarity(symptoms_vector, _vectors)[0]
    
    # sort by similarity
    diseases_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])
    
    seen = set()
    results = []
    for idx, score in diseases_list:
        disease = _dd_clean_clean.iloc[idx].diseases
        if disease not in seen:
            seen.add(disease)
            results.append((disease, round(float(score), 3)))
        if len(results) >= top_n:
            break
    return results

ps = PorterStemmer()
_count_vector = CountVectorizer(max_features=5000, stop_words='english')

_diseases_dataset = pd.read_csv("sampl_data/Final_Augmented_dataset_Diseases_and_Symptoms.csv", on_bad_lines="skip")
# reading csv file
_dd_clean_mutated = clean_disease_csv(_diseases_dataset)
_dd_clean_clean = _dd_clean_mutated[['diseases', 'tags']]

_dd_clean_clean["tags"] = _dd_clean_clean["tags"].apply(stem)
#
_vectors = _count_vector.fit_transform(_dd_clean_clean['tags']).toarray()
_similarity = cosine_similarity(_vectors)

print(find_disease_by_symptoms("I have cough, runny nose and headache", top_n=10)) #
