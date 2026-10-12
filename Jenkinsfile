pipeline {
  agent any

  options {
    timestamps()
  }

  triggers {
    pollSCM('H/2 * * * *')
  }

  environment {
    IMAGE    = 'isurumadusara/tasks-app'
    EC2_HOST = credentials('ec2-host')
  }

  stages {
    stage('Install and Test') {
      steps {
        sh 'node -v'
        sh 'npm ci'
        sh 'npm test'
      }
    }

    stage('Build Image') {
      steps {
        sh 'docker build -t $IMAGE:$BUILD_NUMBER -t $IMAGE:latest .'
      }
    }

    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
          sh 'docker push $IMAGE:$BUILD_NUMBER'
          sh 'docker push $IMAGE:latest'
        }
      }
    }

    stage('Deploy to AWS') {
      steps {
        sshagent(['ec2-ssh']) {
          sh '''
            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST 'mkdir -p ~/app'
            scp -o StrictHostKeyChecking=no docker-compose.prod.yml ubuntu@$EC2_HOST:~/app/docker-compose.yml
            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST "cd ~/app && IMAGE=$IMAGE TAG=$BUILD_NUMBER docker compose pull && IMAGE=$IMAGE TAG=$BUILD_NUMBER docker compose up -d"
          '''
        }
      }
    }

    stage('Smoke Test') {
      steps {
        sh 'sleep 10 && curl -f http://$EC2_HOST/health'
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}
