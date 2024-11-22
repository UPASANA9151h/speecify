from flask import Flask, request, send_file, render_template, jsonify
from gtts import gTTS
from flask_cors import CORS
from googletrans import Translator
import os
import io
from uuid import uuid4

app = Flask(__name__)
CORS(app)
translator = Translator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_to_speech():
    text = request.form['text']
    language = request.form.get('language', 'en')  # Default to English if no language is provided

    # Translate the text if the language is not English
    if language != 'en':
        translated_text = translator.translate(text, dest=language).text
    else:
        translated_text = text

    # Generate speech in the selected language
    tts = gTTS(text=translated_text, lang=language)
    file_io = io.BytesIO()
    tts.write_to_fp(file_io)
    file_io.seek(0)

    return send_file(file_io, as_attachment=True, download_name=f"{uuid4()}.mp3", mimetype='audio/mpeg')

if __name__ == '__main__':
    if not os.path.exists("static"):
        os.makedirs("static")
    app.run(debug=False)
