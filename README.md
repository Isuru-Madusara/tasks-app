# Tasks App --- DevOps CI/CD Project

A containerized Tasks API deployed to AWS EC2 through a Jenkins CI/CD
pipeline. This project demonstrates how application code, automated
testing, Docker image publishing, cloud infrastructure, and deployment
can work together.

## Architecture

**Developer → Git/GitHub → Jenkins → Docker Hub → AWS EC2**

-   **Git** tracks source-code changes and versions.
-   **GitHub** hosts the source repository.
-   **Jenkins** checks out the code, installs dependencies, runs tests,
    builds the Docker image, pushes it to Docker Hub, deploys it to EC2
    over SSH, and runs a health check.
-   **Docker** packages the application into an image and runs it in a
    container.
-   **Docker Hub** stores the published application image.
-   **Terraform** is used to define/provision AWS infrastructure as
    code.
-   **AWS EC2** hosts the deployed containers.
-   **Docker Compose** runs the application and PostgreSQL database
    services.
-   **PostgreSQL** stores task data.

> Note: Terraform infrastructure provisioning and the Jenkins
> application-deployment pipeline are separate steps unless you
> explicitly add Terraform commands to the Jenkinsfile.

## Technology Stack

-   Node.js 20
-   Express
-   PostgreSQL
-   Docker and Docker Compose
-   Jenkins
-   Git and GitHub
-   Docker Hub
-   Terraform
-   AWS EC2

## CI/CD Pipeline

The Jenkins pipeline performs these stages:

1.  **Checkout SCM** --- retrieves the source code from GitHub.
2.  **Install and Test** --- installs Node.js dependencies and runs the
    test suite.
3.  **Build Image** --- builds the Docker image with the repository name
    `isurumadusara/tasks-app`.
4.  **Push Image** --- publishes the image tags to Docker Hub.
5.  **Deploy to AWS** --- connects to the EC2 instance over SSH,
    transfers the production Compose configuration, pulls the required
    images, and starts the containers.
6.  **Smoke Test** --- requests the `/health` endpoint to verify that
    the deployed application responds.

In the latest successful pipeline run, all four application tests
passed, the Docker images were pushed, the containers started on EC2,
and the health endpoint returned:

``` json
{"status":"ok"}
```

## Run Locally

Requirements: Node.js 20+, npm, Docker, and Docker Compose.

1.  Clone the repository:

    ``` bash
    git clone https://github.com/Isuru-Madusara/tasks-app.git
    cd tasks-app
    ```

2.  Install dependencies:

    ``` bash
    npm ci
    ```

3.  Configure the environment variables required by the application and
    database. Check the project's configuration/code for the exact
    variable names. Do not commit real passwords, tokens, or `.env`
    files.

4.  Start the application using the local instructions and Compose file
    available in this repository. If a Compose configuration is
    provided, a common command is:

    ``` bash
    docker compose up -d --build
    ```

    If your Compose file has a different name, pass it with `-f`, for
    example:

    ``` bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

5.  Check the health endpoint:

    ``` bash
    curl -i http://localhost:3000/health
    ```

    Use the host port configured in your Compose file if it is not
    `3000`.

## Run Tests

Install dependencies and run the test script defined in `package.json`:

``` bash
npm ci
npm test
```

The Jenkins run reported these four validation tests passing:

-   Accepts a normal task title
-   Rejects an empty title
-   Rejects a non-string title
-   Rejects an excessively long title

## Docker Image

The Jenkins pipeline publishes the image under:

``` text
isurumadusara/tasks-app:latest
isurumadusara/tasks-app:<build-number>
```

For example, the successful run published build tag `6` as well as
`latest`.

To pull the image manually:

``` bash
docker pull isurumadusara/tasks-app:latest
```

The exact runtime command and required environment variables depend on
the Compose/application configuration.

## Infrastructure with Terraform

Terraform configuration is used to describe AWS resources as code. A
typical workflow is:

``` bash
terraform init
terraform plan
terraform apply
```

Run these commands from the directory containing the Terraform
configuration. Review the plan before applying it, and configure AWS
credentials and region securely. Do not commit Terraform state files,
private keys, or credentials.

## Jenkins Credentials and Configuration

The pipeline uses Jenkins-managed credentials for Docker Hub
authentication and SSH access to the EC2 instance. Configure credentials
in Jenkins rather than hardcoding secrets in the `Jenkinsfile`.

Before running the pipeline, verify:

-   Jenkins can access the GitHub repository.
-   The Jenkins agent can run Docker commands.
-   Docker Hub credentials are configured in Jenkins.
-   The EC2 SSH private key is stored securely in Jenkins.
-   EC2 security-group rules allow the required SSH access and
    application traffic.
-   The production Compose configuration and required environment
    variables are available on the server.

## Security Notes

-   Never commit `.env`, passwords, access tokens, SSH private keys, or
    AWS credentials.
-   Restrict SSH access to trusted IP addresses where practical.
-   Expose only the ports needed by the application.
-   Keep database credentials out of source control.
-   Consider pinning production images to immutable version tags instead
    of relying only on `latest`.

## Project Goals and Learning

This project was built to practice:

-   Source control with Git and GitHub
-   Automated testing and CI/CD with Jenkins
-   Containerizing an application with Docker
-   Publishing and pulling images through Docker Hub
-   Provisioning cloud infrastructure using Terraform
-   Deploying containers to AWS EC2 using SSH and Docker Compose
-   Validating a deployment with an HTTP health check

## Repository

GitHub: https://github.com/Isuru-Madusara/tasks-app

## Author

**Isuru Madusara**

Feel free to explore the repository and share feedback.
