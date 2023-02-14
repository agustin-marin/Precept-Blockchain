/*IMPORTANT: PREVIOUS CONFIGURATION
In order for the SSH connection to work automatically and not hang while waiting for a password to be entered, we will need to follow these steps before running this pipeline:
1. Open a terminal and connect via SSH to the machine hosting the Jenkins service.
2. Become superuser by executing the command "sudo su".
3. Become the user "jenkins" by running the command "su -l jenkins".
4. Access the ".ssh" folder by executing the "cd .ssh" command.
5. If this folder does not exist in the user's "home" or if after executing the "ls -l" command we see that it does not contain the files with the user's public and private keys, we will have to create them by executing the "ssh-keygen" command, pressing the "enter" key until its execution is finished. Otherwise, we will go directly to the next step.
6. Show the content of the file that contains the public key of the user executing the command "cat id_rsa.pub" and copy the string shown.
7. Open another terminal and connect via SSH to the machine to which the SSH connection will be made during the execution of the pipeline.
8. Repeat steps 4 and 5.
9. Modify the "authorized_keys" file to add the string that we copied in step 6 on a new line at the end. If said file does not exist, we must create it ourselves and also add the string that we copied in step 6.*/
pipeline {
    agent any
    triggers {
        cron('0 */8 * * *')
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
        buildDiscarder(logRotator(daysToKeepStr: "30"))
        /*Executes the code inside the block with a determined time out limit. If the time limit is reached, an exception is thrown, which leads to aborting the build (unless it is caught and processed somehow).
            time : int
                The length of time for which this step will wait before cancelling the nested block.
            activity : boolean (optional)
                Timeout after no activity in logs for this block instead of absolute duration. Defaults to false.
            unit (optional)
                The unit of the time parameter. Defaults to 'MINUTES' if not specified.
                Values: NANOSECONDS, MICROSECONDS, MILLISECONDS, SECONDS, MINUTES, HOURS, DAYS
        */
        timeout(time: 24, unit: 'HOURS')
    }
    environment {
        // como el jenkins se lanza en orderer y quizá interesa más saber el espacio en disco de peer
        machineOrderer=''
        machineUser = 'debian'
        machinepeerIP = '10.208.211.33' // de momento esta ip funciona pq el jenkins está en la misma red privada que el peer
        lowerLimit = 85
        upperLimit = 90
        emailRecipient = 'agustin.marinf@um.es'
        emailFrom = 'agustin.marinf@um.es'
        identifierProject = 'DLT-BLOCKCHAIN'
        scriptPath = '/etc/jenkins/Request.sh'
        scriptPath2 = '/etc/jenkins/RequestnoSSH.sh'
    }
    stages {
        stage('Request') {
            steps {
                script {
                    env.previousBuildResult = currentBuild.getPreviousBuild()?.result
                    env.result1 = sh(returnStdout: true, script: "\"${env.scriptPath}\" \"${machineUser}\" \"${machinepeerIP}\" ${lowerLimit} ${upperLimit} \"${env.previousBuildResult}\"").trim()
                    env.result2 = sh(returnStdout: true, script: "\"${env.scriptPath2}\" \"${machineUser}\" \"${machinepeerIP}\" ${lowerLimit} ${upperLimit} \"${env.previousBuildResult}\"").trim()
                    if(env.result1.contains("ERROR") || env.result2.contains("ERROR")) {
                        error "Error, resul peer: ${env.result1} orderer: ${env.result2}"
                        }
                    echo "result: ${env.result1}"
                    echo "result: ${env.result2}"
                    if (env.result1 == "FAILURE") {
                        error "Error, resul peer: ${env.result1}"
                    }
                    if (env.result2 == "FAILURE") {
                        error "Error, resul orderer: ${env.result2}"
                    }
                }
            }
        }
        stage ('CleanUp workspace') {
            //Limpiamos el workspace para no llenar los discos
            steps {
                echo "Borrado de workspace..."
                deleteDir()
            }
        }
    }
    post {
        /*
            always: Run the steps in the post section regardless of the completion status of the Pipeline’s or stage’s run.
            changed: Only run the steps in post if the current Pipeline’s or stage’s run has a different completion status from its previous run.
            fixed: Only run the steps in post if the current Pipeline’s or stage’s run is successful and the previous run failed or was unstable.
            regression: Only run the steps in post if the current Pipeline’s or stage’s run’s status is failure, unstable, or aborted and the previous run was successful.
            aborted: Only run the steps in post if the current Pipeline’s or stage’s run has an "aborted" status, usually due to the Pipeline being manually aborted. This is typically denoted by gray in the web UI.
            failure: Only run the steps in post if the current Pipeline’s or stage’s run has a "failed" status, typically denoted by red in the web UI.
            success: Only run the steps in post if the current Pipeline’s or stage’s run has a "success" status, typically denoted by blue or green in the web UI.
            unstable: Only run the steps in post if the current Pipeline’s or stage’s run has an "unstable" status, usually caused by test failures, code violations, etc. This is typically denoted by yellow in the web UI.
            cleanup:Run the steps in this post condition after every other post condition has been evaluated, regardless of the Pipeline or stage’s status.
        */
        /*changed {
            mail to: "${emailRecipient}",
                    from: "${emailFrom}",
                        subject: "${identifierProject} - ${env.JOB_BASE_NAME}: Changed Pipeline to ${currentBuild.result}",
                            body: "Run has a different completion status from its previous run: ${env.BUILD_URL}"
        }*/
        failure {
            mail to: "${emailRecipient}",
                    from: "${emailFrom}",
                        subject: "${identifierProject} - ${env.JOB_BASE_NAME}: ${currentBuild.result}",
                            body: "Run has a completion status: ${env.BUILD_URL}\n\nScripts error: \n Error, \n\tPEER RESULT: ${env.result1}\n\n\tORDERER RESULT: ${env.result2}"
        }

    }
}
