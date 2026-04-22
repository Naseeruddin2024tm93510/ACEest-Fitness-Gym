pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'naseeruddin2024' 
        DOCKER_IMAGE = "${DOCKER_HUB_USER}/aceest-fitness-backend:${env.BUILD_NUMBER}"
    }
    
    parameters {
        choice(name: 'DEPLOY_STRATEGY', choices: ['RollingUpdate', 'Blue-Green', 'Canary'], description: 'Production Deployment Strategy')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo 'Running CI (Build & Test) for all branches...'
                bat '''
                    set PYTHON_CMD=python
                    where python >nul 2>nul
                    if %ERRORLEVEL% neq 0 (
                        set PYTHON_CMD=py
                    )
                    
                    if not exist venv (
                        %PYTHON_CMD% -m venv venv
                    )
                    call venv\\Scripts\\activate
                    pip install -r requirements.txt
                    %PYTHON_CMD% -m pytest tests/ -v
                '''
            }
        }

        stage('Docker Push') {
            when {
                anyOf {
                    branch 'staging'
                    branch 'main'
                }
            }
            steps {
                script {
                    echo "Building and pushing image for deployment: ${DOCKER_IMAGE}"
                    // bat "docker build -t ${DOCKER_IMAGE} -f Dockerfile.backend ."
                    // withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
                    //    bat "docker login -u %U% -p %P%"
                    //    bat "docker push ${DOCKER_IMAGE}"
                    // }
                    echo 'Docker build/push placeholder - please configure credentials in Jenkins.'
                }
            }
        }

        stage('Deploy to Staging') {
            when { branch 'staging' }
            steps {
                echo 'Deploying to Staging (Port 30081)...'
                bat '''
                    kubectl apply -f k8s/namespaces.yaml
                    kubectl apply -f k8s/staging/deployment.yaml
                '''
            }
        }

        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                script {
                    echo "Deploying to Production (Port 30080) using ${params.DEPLOY_STRATEGY}..."
                    bat "kubectl apply -f k8s/namespaces.yaml"
                    
                    if (params.DEPLOY_STRATEGY == 'RollingUpdate') {
                        bat "kubectl apply -f k8s/production/deployment.yaml"
                    } else {
                        // For other strategies, apply the template
                        bat "kubectl apply -f k8s/strategies/deployment_strategies.yaml"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}
