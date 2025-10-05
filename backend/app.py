from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def serve_index():
    """Serves the index.html file located in the 'frontend' directory."""
    try:
        return send_file(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'index.html'))
    except Exception as e:
        return f"Error serving index.html: {e}. Please ensure 'index.html' is in the 'frontend' directory.", 500


if __name__ == '__main__':
    print("Minimal server started. Open http://127.0.0.1:5000 in your browser.")
    app.run(debug=True)