from flask import Flask, render_template, request, jsonify
from utils import preprocess, predict
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return render_template('inference.html')

@app.route('/analyze', methods=['POST'])
def inference():
    global age
    global sex
    global predictions
    age = request.form['age']
    sex = request.form['sex']
    left_scan_file = request.files['left-scan']
    right_scan_file = request.files['right-scan']

    left_img = preprocess(left_scan_file)
    right_img = preprocess(right_scan_file)
    
    predictions = predict(left=left_img, right=right_img, age=age, sex=sex)

    return json.dumps(predictions)

load_dotenv()

apikey = os.getenv("OPENAI_API_KEY")

@app.route('/cgpt_suggest', methods=['POST'])
def CGTP_Suggestions():
    llm = ChatOpenAI()
    medical_QA_template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                f"""You are a opthalamologist. You are tasked to provide the following sections:
                1. Disease description
                2. Possible cures
                3. Next steps. 
                You will be provided with pateint details and multiclass disease predictions from an AI model.
                Consider only those deseases whose confidence is higher than 50%.
                If none of the diseases have a confidence percentage higher than 50%, then select the disease with highest confidence.
                Patient details contains the age, sex and predictions contains the output probabilities for each of the class of diseases.
                Note: 
                1. Ignore the class "others".
                2. While providing information, keep in consideration the patient's age and sex.
            """,
            ),
            ("user", "{input}"),
        ]
    )
    medical_QA_chain = medical_QA_template | llm

    output = medical_QA_chain.invoke(
        {"input": f"Age: {age}, Sex: {sex}, Confidences:{predictions}"}
    ).content
    
    response = {
        'cgpt_text': output
    }

    return jsonify(response)

if __name__=='__main__':
    app.run(port=3000, debug=True)
