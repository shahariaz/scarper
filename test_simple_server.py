"""
Simple test backend server to check if Flask routes work
"""

from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok'})
    
    @app.route('/test', methods=['GET'])
    def test_route():
        return jsonify({'message': 'test works'})
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True)
