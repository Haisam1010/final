import string
import keras
from flask_jwt_extended import JWTManager, create_access_token
import re
import os
import emoji
import nltk
import tensorflow as tf
import pickle
from keras.models import load_model
from keras.preprocessing import sequence
from nltk.stem import PorterStemmer
import mysql.connector
from flask import Flask, request, jsonify,render_template
import pymysql
app = Flask(__name__)

def clean_text(text):
    text = str(text).lower()
    text = emoji.demojize(text)
    text = re.sub('\[.*?\]', '', text)
    text = re.sub('https?://\S+|www\.\S+', '', text)
    text = re.sub('<.*?>+', '', text)
    text = re.sub('[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub('\n', '', text)
    text = re.sub('\w*\d\w*', '', text)
    text = [word for word in text.split(' ') if word not in stopword]
    text = " ".join(text)
    text = " ".join(text.split())
    return text


nltk.download('punkt')
stemmer = PorterStemmer()

stopword = []
stemmer = None

app.config['JWT_SECRET_KEY'] = '1234567'
jwt = JWTManager(app)


# MySQL Database Configuration
mydb = mysql.connector.connect(
    host="localhost",
    user="myuser",
    password="12345678",
    database="mydatabase",
)
if mydb.is_connected():
    print("Connected to MySQL on localhost!")
cursor = mydb.cursor()

# Get the current directory where the script is located
current_directory = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_directory, 'hate_abusive_model_latest.h5')
tokenizer_path = os.path.join(current_directory, 'tokenizer_latest.pickle')

load_model = keras.models.load_model(model_path)
with open(tokenizer_path, 'rb') as handle:
    load_tokenizer = pickle.load(handle)

def check_post_existence(post_id):
    try:

        sql = "SELECT id FROM posts WHERE id = %s"
        cursor.execute(sql, (post_id,))
        result = cursor.fetchone()

        return result is not None

    except pymysql.Error as e:
        print(f"Database error: {e}")
        return False

@app.route("/")
def hello_world():
  return 'hello'


@app.route('/authenticate', methods=['POST'])
def authenticate():
    try:
        data = request.get_json()
        username = data['username']
        password = data['password']

        sql = "SELECT * FROM users WHERE username = %s AND password = %s"
        cursor.execute(sql, (username, password))
        user = cursor.fetchone()

        if user:
            # Generate an access token upon successful authentication
            access_token = create_access_token(identity=username)
            return jsonify({'token': access_token}), 200
        else:
            return jsonify({'error': 'Authentication failed'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    render_template('')


@app.route('/add_post', methods=['POST'])
def add_post():
    try:
        content = request.json.get('content')
        cleaned_text = clean_text(content)

        seq = load_tokenizer.texts_to_sequences([cleaned_text])
        padded = sequence.pad_sequences(seq, maxlen=300)
        pred = load_model.predict(padded)

        if pred <= 0.5:

            sql = "INSERT INTO posts (content) VALUES (%s)"
            cursor.execute(sql, (content.encode('utf-8'),))
            mydb.commit()

            # Retrieve the ID of the newly added post
            post_id = cursor.lastrowid

            return jsonify({'message': 'Post added successfully', 'post_id': post_id}), 200
        else:
            return jsonify({'error': 'Hate or Offensive speech detected'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_posts', methods=['GET'])
def get_posts():
    try:
        sql = "SELECT * FROM posts"
        cursor.execute(sql)
        posts = cursor.fetchall()
        post_list = [{'id': post[0], 'content': emoji.emojize(post[1])} for post in posts]
        return jsonify(post_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update_post/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    try:
        content = request.json.get('content')
        cleaned_text = clean_text(content)
        post_exists = check_post_existence(post_id)

        seq = load_tokenizer.texts_to_sequences([cleaned_text])
        padded = sequence.pad_sequences(seq, maxlen=300)
        pred = load_model.predict(padded)

        if pred <= 0.5:
            sql = "UPDATE posts SET content = %s WHERE id = %s"
            cursor.execute(sql, (content.encode('utf-8'), post_id))
            mydb.commit()
            return jsonify({'message': 'Post updated successfully'}), 200
        else:
            return jsonify({'error': 'Hate speech detected'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/delete_post/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        sql = "DELETE FROM posts WHERE id = %s"
        cursor.execute(sql, (post_id,))
        mydb.commit()
        return jsonify({'message': 'Post deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=3000)