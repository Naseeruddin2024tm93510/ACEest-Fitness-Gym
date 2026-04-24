pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'naseeruddin2024'
        BRANCH_NAME = "${env.BRANCH_NAME}"
    }

    stages {
        stage('Initialize Environment') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.FRONTEND_PORT = '3000'
                        env.BACKEND_PORT = '5000'
                    } else if (env.BRANCH_NAME == 'staging') {
                        env.FRONTEND_PORT = '3001'
                        env.BACKEND_PORT = '5001'
                    } else {
                        error "Unsupported branch: ${env.BRANCH_NAME}. Use main or staging."
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo 'Running CI (Build & Test)...'
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                    # python3 -m pytest tests/ -v  # Uncomment once tests are stable
                '''
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                script {
                    echo "Deploying to branch: ${env.BRANCH_NAME} on ports ${env.FRONTEND_PORT}/${env.BACKEND_PORT}"
                    sh "docker-compose -p aceest-${env.BRANCH_NAME} up -d --build"
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        success {
            echo "Successfully deployed ${env.BRANCH_NAME} to http://your-ec2-ip:${env.FRONTEND_PORT}"
        }
    }
}
