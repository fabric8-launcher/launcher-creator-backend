# launcher-creator-backend

[![Build Status](https://semaphoreci.com/api/v1/fabric8-launcher/launcher-creator-backend/branches/master/badge.svg)](https://semaphoreci.com/fabric8-launcher/launcher-creator-backend)

This is the _engine_ to perform the actual code generation. It has command line tools that can generate code locally and a REST service that
can either return a ZIP file or pass the generated code to the Launcher Backend for publishing on GitHub and OpenShift.

The fundamental design idea for this engine is the concept of _Capabilities_ and _Generators_. Things are described in more detail
below but basically it comes down to _Generators_ creating the very simple and basic pieces of a project and _Capabilites_
being like the director that groups and manages them to create a final composition. _Generators_ just know to _do_ one thing,
while a _Capability_ holds all the intelligence and knowledge on _how_ to put them together to create something useful.

The process is simple: you start with an empty directory and apply capabilities to it using the commands described below.

## Usage

For the first time you'll need Yarn to install all the dependencies. Run the following command in the root of a clone of this repository:

```
$ yarn install
```

To get a list of the capabilities you can apply to your project run:

```
$ yarn -s apply capabilities
```

To apply a specific capability you need its name and which properties to pass. Use the `--help` option to find out what
properties are supported/required by the Capability, for example:

```
$ yarn -s apply database --help
```

To actually apply the Capability to the project pass all the required arguments and properties, for example:

```
$ yarn -s apply path/to/project "my-app" welcome
```

But for most capabilities need to specify a "runtime". You can get the list of runtimes by running:

```
$ yarn -s apply runtimes
```

Then you pick the one you want and you pass it on the command line, eg:

```
$ yarn -s apply path/to/project --runtime vertx "my-app" rest
```

Some capabilities can also take extra properties that change their default behaviour, eg:

```
$ yarn -s apply path/to/project --runtime vertx "my-app" database '{ "databaseType": "mysql" }'
```

After the application has been generated it can be deployed in the currently active project on OpenShift by going into the
project folder and running:

```
$ ./gap deploy
```

Now the only thing that is left to do is push the project's code to OpenShift to be run. There are two ways of doing that,
one is by first building the project yourself locally and pushing the resulting binary, like this (assuming a Maven project):

```
$ mvn clean install
$ ./gap push --binary
```

In most cases you can leave out the `--binary` flag because that's the default if a binary is available. In case you want
to push the sources and have the project be built on OpenShift you can do the following:

```
$ ./gap push --source
```

This is also the default when no binary is available and you omit the `--source` flag.

## Stages

 - **Apply** Stage - This is where the Generators, executed by the Capabilities, can make changes to the user's project
 and add their own Resources to the final list of OpenShift/K8s Resources that will be created in the user's OpenShift
 environment. In this stage a _Generator_ can copy (template) files from the Generators to the user's project, generate
 files or change already existing files. This is done _only once_ when the user _applies_ the Capability to their project.
- **Deploy** Stage - This is where the result from a previous **Apply** Stage is taken and installed in an OpenShift
instance. Generators and Capabilities don't do anything in this stage (although this might be revisted in the future).

## Folder structure

 - **lib**
   - **generators** - All _Generator_ modules are found in this folder.
   - **capabilities** - All _Capability_ modules are found in this folder.
   - **core** - 
     This folder contains core modules that provide support for the
     capabilites and the generators.
     - **deploy** - Module that can execute Capabilites, manages the `deployment.json` descriptor file,
       can generate a project's Resource file and can deploy it to OpenShift.
     - **info** - Module that deals with input validation mostly.
     - **maven** - Module with maven-specific utilities, like merging `pom.xml` files.
     - **resources** - Module that deals with OpenShift/K8s Resource lists.
     - **utils** - Miscelleaneous utility functions.
   
## Generators

Generators are modules that make changes to a user's project. Each module generally only makes a very specific
and limited set of changes, using the UNIX philosophy of "Do one thing and do it well".

For example a _Generator_ "mySQL" might create the necessary OpenShift/K8s Resources to set up a database service
on OpenShift. Another one might create the code to connect to a database from Node.js.

Try not to make a _Generator_ do too much, think of who would be maintaining the module for example. If a _Generator_
could generate the code for all the available languages it would soon become pretty complex and all the different people
or teams that have the necessary expertise for their particular language would have to collaborate on that one module.
Better to create one module for each language. If there are many common elements, for example they use a lot of the same
supporting non-code files, consider splitting those out into a different module.

So make _Generators_ simple, move the complexity to the _Capabilities_.

## Capabilities

Capabilities are modules that bundle one or more generators to add a set of features to a user's project that
together implement a useful and fleshed-out use-case. _Generators_ **do**, while _Capabilities_ **manage**.

For example, a "Database" _Capability_ might call on a _Generator_ that would create a mySQL database service,
while using another to create the _Secret_ that will store the database's connection information. Yet another
_Generator_ would create the Java code based on the Vert.x framework and copy that to the user's project. The
choice of database (mySQL, PostgreSQL, etc) and code language and framework (Node.js, Vert.x, Spring Boot, etc)
could be options that the user can pass to the _Capability_. In that aspect a _Capability_ can be as complex as
you want it to be.

## Development

To make sure that any changes you make are properly propagated to all modules you might have to run the folowing
command:

```
$ yarn install --force
```

For information on how to develop your own _Generators_ and _Capabilities_ see the
[Contributing](https://github.com/fabric8-launcher/launcher-creator-backend/wiki/Contributing) page in the Wiki.

## Deploy on OpenShift

```
$ oc new-app \
     quintesse/node-java-oc-odo~https://github.com/fabric8-launcher/launcher-creator-backend \
     --name launcher-creator-backend \
     -e LAUNCHER_BACKEND_URL=https://forge.api.prod-preview.openshift.io/api
```

