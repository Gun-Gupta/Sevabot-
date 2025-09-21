import joblib
from nltk.stem.porter import PorterStemmer
from sklearn.metrics.pairwise import cosine_similarity

ps = PorterStemmer()
data_path = "ai/disease/model_data.pkl"
vectorizer_path = "ai/disease/vectorizer.pkl"
vectors_path = "ai/disease/vectors.pkl"

class DiseaseModel:
    def __init__(self, data_path=data_path, vectorizer_path=vectorizer_path, vectors_path=vectors_path):
        self._df = joblib.load(data_path)
        self._count_vector = joblib.load(vectorizer_path)
        self._vectors = joblib.load(vectors_path)

    def _stem(self, text):
        return " ".join([ps.stem(w) for w in text.split()])

    def _preprocess_text(self, text):
        return self._stem(text.lower().replace(" ", ""))

    def find_disease_by_symptoms(self, symptoms, min_score=0.1):
        symptoms = self._preprocess_text(symptoms)
        symptoms_vector = self._count_vector.transform([symptoms]).toarray()
        distances = cosine_similarity(symptoms_vector, self._vectors)[0]
        diseases_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])

        results = []
        for idx, score in diseases_list:
            if score >= min_score:
                row = self._df.iloc[idx]
                results.append({
                    "index": int(idx),
                    "score": round(float(score), 3),
                    "symptoms": row.get("Symptoms"),
                    "specialization": row.get("Specialization"),
                    "location": row.get("Location"),
                    "doctor": row.get("Doctor"),
                    "clinic_name": row.get("Clinic Name"),
                    "fees": row.get("Fees"),
                    "timings": row.get("Timing")
                })
        return results
