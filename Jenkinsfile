pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Backend & Test') {
            steps {
                echo 'Setting up Python virtual environment and installing dependencies...'
                // Using bat since you are on Windows PowerShell/CMD
                bat '''
                    python -m venv venv
                    call venv\\Scripts\\activate
                    pip install -r requirements.txt
                    echo 'Running Pytest...'
                    python -m pytest tests/ -v
                '''
            }
        }

        stage('Verify Docker Build') {
            steps {
                echo 'Verifying that Docker Compose builds successfully...'
                bat 'docker compose build'
            }
        }
    }
    
    post {
        always {
            echo 'CI Pipeline finished.'
        }
        success {
            echo 'All tests passed and Docker build succeeded!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
