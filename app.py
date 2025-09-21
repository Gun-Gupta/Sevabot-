from flask import Flask, render_template, request, jsonify
from ai.disease.diseaseModel import DiseaseModel
# Load once (fast, no retraining)
disease_model = DiseaseModel()

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    print("here")
    return render_template("home/home.html") #file will open

@app.route("/predict", methods=["GET"])
def predict_get():
    # Get query parameters
    symptoms = request.args.get("symptoms", "")
    min_score = float(request.args.get("min_score", 0.1))
    
    results = disease_model.find_disease_by_symptoms(symptoms, min_score=min_score)
    return jsonify(results)

@app.route("/predict", methods=["POST"])
def predict():
    # Get query parameters
    request_data = request.json
    symptoms = request_data.get("symptoms", "")
    min_score = float(request_data.get("min_score", 0.3))
    
    results = disease_model.find_disease_by_symptoms(symptoms, min_score=min_score)
    return jsonify(results)



if __name__ == "__main__":
    app.run(debug=True)
