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
                        env.K8S_NAMESPACE = 'production'
                    } else if (env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop' || env.BRANCH_NAME.startsWith('PR-')) {
                        env.FRONTEND_PORT = '3001'
                        env.BACKEND_PORT = '5001'
                        env.K8S_NAMESPACE = 'staging'
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
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    echo 'Running Static Code Analysis...'
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh "sonar-scanner \
                            -Dsonar.projectKey=ACEest-fitness \
                            -Dsonar.sources=app/ \
                            -Dsonar.host.url=http://localhost:9000 \
                            -Dsonar.token=${SONAR_TOKEN}"
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    def cleanBranch = env.BRANCH_NAME.toLowerCase().replace('pr-', 'pr')
                    env.DOCKER_TAG = "${cleanBranch}-${env.BUILD_NUMBER}"
                    env.DOCKER_IMAGE = "${DOCKER_HUB_USER}/aceest-backend:${env.DOCKER_TAG}"

                    echo "Building Docker image: ${env.DOCKER_IMAGE}"
                    sh "docker build -t ${env.DOCKER_IMAGE} -f Dockerfile.backend ."

                    // Also tag as latest for the branch
                    sh "docker tag ${env.DOCKER_IMAGE} ${DOCKER_HUB_USER}/aceest-backend:${cleanBranch}-latest"

                    echo "Pushing images to Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
                        sh "docker login -u ${U} -p ${P}"
                        sh "docker push ${env.DOCKER_IMAGE}"
                        sh "docker push ${DOCKER_HUB_USER}/aceest-backend:${cleanBranch}-latest"
                    }
                }
            }
        }

        stage('Deploy (Docker Compose)') {
            steps {
                script {
                    def cleanBranch = env.BRANCH_NAME.toLowerCase().replace('pr-', 'pr')
                    echo "Safeguarding ports: Cleaning up any old containers on ${env.FRONTEND_PORT}/${env.BACKEND_PORT}..."
                    sh "docker ps -q --filter \"publish=${env.BACKEND_PORT}\" | xargs -r docker stop || true"
                    sh "docker ps -q --filter \"publish=${env.BACKEND_PORT}\" | xargs -r docker rm || true"
                    sh "docker ps -q --filter \"publish=${env.FRONTEND_PORT}\" | xargs -r docker stop || true"
                    sh "docker ps -q --filter \"publish=${env.FRONTEND_PORT}\" | xargs -r docker rm || true"

                    echo "Deploying to branch: ${env.BRANCH_NAME} on ports ${env.FRONTEND_PORT}/${env.BACKEND_PORT}"
                    sh "FRONTEND_PORT=${env.FRONTEND_PORT} BACKEND_PORT=${env.BACKEND_PORT} BRANCH_NAME=${cleanBranch} docker-compose -p aceest-${cleanBranch} up -d --build"
                }
            }
        }

        stage('Deploy (Kubernetes)') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    script {
                        def cleanBranch = env.BRANCH_NAME.toLowerCase().replace('pr-', 'pr')

                        echo "Deploying to Kubernetes namespace: ${env.K8S_NAMESPACE}"

                        // Create namespaces if they don't exist
                        sh "kubectl apply -f k8s/namespaces.yaml || true"

                        // Deploy using Rolling Update strategy
                        if (env.BRANCH_NAME == 'main') {
                            // Update the image in the production deployment manifest
                            sh "sed -i 's|naseeruddin786/aceest-backend:main-latest|${env.DOCKER_IMAGE}|g' k8s/production/deployment.yaml"
                            sh "kubectl apply -f k8s/production/deployment.yaml"
                            sh "kubectl rollout status deployment/aceest-fitness-backend -n production --timeout=120s"
                        } else {
                            sh "sed -i 's|naseeruddin786/aceest-backend:staging-latest|${env.DOCKER_IMAGE}|g' k8s/staging/deployment.yaml"
                            sh "kubectl apply -f k8s/staging/deployment.yaml"
                            sh "kubectl rollout status deployment/aceest-fitness-backend -n staging --timeout=120s"
                        }

                        echo "Kubernetes deployment successful!"
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
        failure {
            script {
                // Automatic rollback on failure
                echo "Build failed! Attempting rollback..."
                sh "kubectl rollout undo deployment/aceest-fitness-backend -n ${env.K8S_NAMESPACE} || true"
            }
        }
    }
}
