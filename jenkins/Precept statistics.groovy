pipeline {
    agent any

    environment {
        POSTMAN_COLLECTION = "/etc/jenkins/PRECEPT.postman_collection.json"
         SCRIPT_FILE = "/etc/jenkins/makeStatistics.py"
         identifierProject = 'DLT-testing(155.54.95.201)'
    }

    triggers {
        cron('55 23 * * *')
    }
    options {
        //Using the Timestamper plugin we can add timestamps to the console log
        timestamps()
        //If specified, only up to this number of build records are kept.
        /*Parameters for logRotator (from the source code):
            daysToKeepStr: history is only kept up to this days.
            numToKeepStr: only this number of build logs are kept.
            artifactDaysToKeepStr: artifacts are only kept up to this days.
            artifactNumToKeepStr: only this number of builds have their artifacts kept.
        */
        buildDiscarder(logRotator(numToKeepStr: "30", artifactNumToKeepStr: "30"))

    }

stages {

        stage('Execute Python statistics script') {
            steps {
                script{
                sh 'python3 ${SCRIPT_FILE}'
                }
            }
        }
    }
    post {
        // The always block is executed every time a build is completed, regardless of the result.
        // This is typically used for cleanup tasks such as deleting workspace files.
        // delete files older than 30 days
        // The success block is executed only if the build was successful.
        // This is typically used for publishing build artifacts, sending notifications, etc.
        //success {

        // The unstable block is executed if the build is marked as unstable.
        // An unstable build means that the build did not complete successfully, but there were no failures.
        // This is typically used for sending notifications or escalating the issue.
        //unstable {
        // The failure block is executed if the build has failed.
        // This is typically used for sending notifications or escalating the issue.
        //failure {
        // The changed block is executed if the build has a different result than the previous build.
        // This is typically used for sending notifications or escalating the issue.
        changed {
            emailext subject: "${identifierProject}: Changed Pipeline to ${currentBuild.result}: ${currentBuild.fullDisplayName}",
            body: "Run has a different completion status from its previous run: ${env.BUILD_URL}\n\nCommand Output:\n${env.output}",
            to: "agustin.marinf@um.es",
            from: "agustin.marinf@um.es"
        }
    }
}