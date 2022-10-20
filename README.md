# bingo

Sample Bingo App using twitter API. 
Using this application to setup Serveless Application using StepFunctions and CI/CD on CodePipeline

it started as a simple study project to try StepFunctions, so no structure TDD... I then used the same code to start creating a pipeline.

Now I'm trying to keep the code and architecture clean enough, new ideas coming every commit.

Steps required


Create Parameters
```bash
aws ssm put-parameter --name "/bingo-app/parameters/GithubToken" --value "" --type String --tags "Key=project,Value=sam-bingo-app"

aws ssm put-parameter --name "/bingo-app/parameters/TwitterConsumerKey" --value "" --type String --tags "Key=project,Value=sam-bingo-app"

aws ssm put-parameter --name "/bingo-app/parameters/TwitterConsumerSecret" --value "" --type String --tags "Key=project,Value=sam-bingo-app"

aws ssm put-parameter --name "/bingo-app/parameters/TwitterAppSecret" --value "" --type String --tags "Key=project,Value=sam-bingo-app"

aws ssm put-parameter --name "/bingo-app/parameters/TwitterAppToken" --value "" --type String --tags "Key=project,Value=sam-bingo-app"
```

Create pipeline
Define SAM template (sam as I can see is still compatible with CLoudformation in some level, everything is working fine so far)
Create System Parameters



```bash
aws cloudformation update-stack --stack-name sam-bingo-build-project --template-body file://pipeline/pipeline.yaml --capabilities CAPABILITY_IAM
```


you can deploy your templates from your local machine too using SAM commands.
```bash
sam build
```

```bash
sam deploy --guided
```

as you can see on buildspec.yaml file I'm not using SAM commands, I thought I'd need too. but since it's using code pipeline to configure the build and deploy steps the configuration is mostly made on the pipeline template.

Since the Build project is referenced on the templete we define the build steps on a separated file.


the code structured is not the best since I'm reusing an old testing code to apply the pipeline configuration steps.
I'm using the same code to reference different steps on my state machine. I won't split each function in one repository, the idea behind it is the same, if you can do one function you can do N, the steps are the same


notes 

issues with `SAM init` try setting the full path location of yor template
```bash
sam init --location "C:\Users\{user}\AppData\Roaming\AWS SAM\aws-sam-cli-app-templates\nodejs14.x\cookiecutter-aws-sam-hello-powertools-typescript-nodejs"
```



