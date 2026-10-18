from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route("/")
def Inicio():
   return render_template("index.html")

@app.route("/encuesta-basica")
def EncuestaBasica():
   return render_template("Encuesta.html")
