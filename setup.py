from setuptools import setup, find_packages

setup(
    name="dashboard-atendimentos",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask>=2.0.0',
        'flask-cors>=4.0.0',
        'google-auth>=2.22.0',
        'google-auth-oauthlib>=1.0.0',
        'google-auth-httplib2>=0.1.0',
        'google-api-python-client>=2.95.0',
        'pandas>=2.0.0',
        'python-dotenv>=1.0.0',
        'pytest>=7.0.0',
    ],
    python_requires='>=3.8',
)