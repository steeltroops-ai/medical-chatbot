from setuptools import setup, find_packages

setup(
    name="medical-chatbot",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'flask',
        'flask-cors',
        'python-dotenv',
        'openai',
        'flask-sqlalchemy',
        'flask-login'
    ]
)
