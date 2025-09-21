from flask import Flask, request, jsonify
from ai.disease.diseaseModel import DiseaseModel
# Load once (fast, no retraining)
disease_model = DiseaseModel()

app = Flask(__name__)

@app.route("/predict", methods=["GET"])
def predict():
    # Get query parameters
    symptoms = request.args.get("symptoms", "")
    min_score = float(request.args.get("min_score", 0.1))
    
    results = disease_model.find_disease_by_symptoms(symptoms, min_score=min_score)
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
