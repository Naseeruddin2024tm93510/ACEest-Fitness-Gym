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
                    } else if (env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop' || env.BRANCH_NAME.startsWith('PR-')) {
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
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh "sonar-scanner \
                        -Dsonar.projectKey=ACEest-fitness \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=${SONAR_TOKEN}"
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                script {
                    def cleanBranch = env.BRANCH_NAME.toLowerCase().replace('pr-', 'pr')
                    echo "Safeguarding ports: Cleaning up any old containers on ${env.FRONTEND_PORT}/${env.BACKEND_PORT}..."
                    // Kill any container currently using our target ports to prevent "Port already allocated" errors
                    sh "docker ps -q --filter \"publish=${env.BACKEND_PORT}\" | xargs -r docker stop || true"
                    sh "docker ps -q --filter \"publish=${env.BACKEND_PORT}\" | xargs -r docker rm || true"
                    sh "docker ps -q --filter \"publish=${env.FRONTEND_PORT}\" | xargs -r docker stop || true"
                    sh "docker ps -q --filter \"publish=${env.FRONTEND_PORT}\" | xargs -r docker rm || true"

                    echo "Deploying to branch: ${env.BRANCH_NAME} on ports ${env.FRONTEND_PORT}/${env.BACKEND_PORT}"
                    sh "FRONTEND_PORT=${env.FRONTEND_PORT} BACKEND_PORT=${env.BACKEND_PORT} BRANCH_NAME=${cleanBranch} docker-compose -p aceest-${cleanBranch} up -d --build"
                }
            }
        }

        stage('Docker Push to Hub') {
            steps {
                script {
                    echo "Pushing images to Docker Hub..."
                    def cleanBranch = env.BRANCH_NAME.toLowerCase().replace('pr-', 'pr')
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
                        sh "docker login -u ${U} -p ${P}"
                        sh "docker tag aceest-${cleanBranch}-backend ${DOCKER_HUB_USER}/aceest-backend:${cleanBranch}-${env.BUILD_NUMBER}"
                        sh "docker push ${DOCKER_HUB_USER}/aceest-backend:${cleanBranch}-${env.BUILD_NUMBER}"
                    }
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
