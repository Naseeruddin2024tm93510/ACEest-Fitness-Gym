pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'naseeruddin786'
        BRANCH_NAME = "${env.BRANCH_NAME}"
    }

    stages {
        stage('Initialize Environment') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.FRONTEND_PORT = '3000'
                        env.BACKEND_PORT = '5000'
                    } else if (env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop') {
                        env.FRONTEND_PORT = '3001'
                        env.BACKEND_PORT = '5001'
                    } else {
                        error "Unsupported branch: ${env.BRANCH_NAME}. Use main, staging, or develop."
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
                    python3 -m pytest tests/ -v
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running Static Code Analysis...'
                // Assumes SonarQube is running on port 9000
                sh 'echo "SonarQube analysis placeholder - Scanner would run here"'
            }
        }

        stage('Docker Push to Hub') {
            steps {
                script {
                    echo "Pushing images to Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
                        sh "docker login -u ${U} -p ${P}"
                        sh "docker tag aceest-${env.BRANCH_NAME}-backend ${DOCKER_HUB_USER}/aceest-backend:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                        sh "docker push ${DOCKER_HUB_USER}/aceest-backend:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                script {
                    echo "Deploying to branch: ${env.BRANCH_NAME} on ports ${env.FRONTEND_PORT}/${env.BACKEND_PORT}"
                    sh "FRONTEND_PORT=${env.FRONTEND_PORT} BACKEND_PORT=${env.BACKEND_PORT} BRANCH_NAME=${env.BRANCH_NAME} docker-compose -p aceest-${env.BRANCH_NAME} up -d --build"
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
