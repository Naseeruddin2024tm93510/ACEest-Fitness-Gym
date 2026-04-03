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
                    if not exist "venv\\Scripts\\activate.bat" (
                        echo "Creating new virtual environment..."
                        python -m venv venv
                    ) else (
                        echo "Virtual environment already exists, skipping creation..."
                    )
                    call venv\\Scripts\\activate
                    echo "Installing dependencies..."
                    pip install -r requirements.txt --disable-pip-version-check
                    echo 'Running Pytest...'
                    python -m pytest tests/ -v
                '''
            }
        }

        stage('Verify Docker Build') {
            steps {
                echo 'Verifying that Docker Compose builds successfully (using parallel BuildKit cache)...'
                bat '''
                    set DOCKER_BUILDKIT=1
                    docker compose build --parallel
                '''
            }
        }

        stage('Deploy to AWS EC2') {
            // Only trigger deployment if we are building the main branch
            when { branch 'main' }
            steps {
                input message: 'All tests passed. Do you want to deploy to the Production EC2 Server?', ok: 'Deploy to Production'
                echo 'Connecting to EC2 instance and deploying latest version...'
                
                // Uses the Jenkins "SSH Agent Plugin" or "Credentials Binding Plugin"
                // You will need to add your EC2 .pem key to Jenkins credentials with ID 'ec2-ssh-key'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                    // Update EC2_USER and EC2_HOST with your actual details
                    bat '''
                        echo "Deploying to EC2 via SSH..."
                        
                        :: Using ssh with strict host key checking disabled for CI
                        ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no ec2-user@YOUR_EC2_PUBLIC_IP "cd ACEest-Fitness-Gym && git pull origin main && docker compose down && docker compose up --build -d"
                    '''
                }
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
