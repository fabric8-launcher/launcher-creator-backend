# launcher-creator-backend

[![Build Status](https://semaphoreci.com/api/v1/fabric8-launcher/launcher-creator-backend/branches/master/badge.svg)](https://semaphoreci.com/fabric8-launcher/launcher-creator-backend)

This is a PoC for the _engine_ that could be used by the Launcher Cloud App Generator (or whatever its name will be) to perform
the actual code generation. Right now it only has command line tools to make it work, but this could easily be made part
of a REST service of some kind that would return a ZIP file.

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
$ yarn run -s apply --list
```

To apply a specific capability you need its name and which properties to pass. Use the `--help` option to find out what
properties are supported/required by the Capability, for example:

```
$ yarn run -s apply database --help
```

To actually apply the Capability to the project pass all the required arguments and properties, for example:

```
$ yarn run -s apply database path/to/project "my-database" '{ "databaseType": "mysql", "runtime": "vertx" }'
```

## Stages

 - **Apply** Stage - This is where the Generators, executed by the Capabilities, can make changes to the user's project.
 This generally entails copying (template) files from the Generators to the user's project, generating files or changing
 already existing files. This is done _only once_ when the user _applies_ the Capability to their project.
 - **Generate** Stage - This is where the Generators, executed by the Capabilities, can add their own Resources to the
 final list of OpenShift/K8s Resources that will be created in the user's OpenShift environment. The _generation_
 of this Resource List will done _each time_ when the user's project needs to be installed in an OpenShift instance.
- **Deploy** Stage - This is where the result from a previous **Generate** Stage is taken and installed in an OpenShift
instance. Generators and Capabilities don't do anything in this stage (although this might be revisted in the future).

## Folder structure

 - **generators** - All _Generator_ modules are found in this folder.
 - **capabilities** - All _Capability_ modules are found in this folder.
 - **core** - 
   This folder contains core modules that provide support for the
   capabilites and the generators.
   - **deploy** - Module that can execute Capabilites, manages the `deployment.json` descriptor file,
   can generate a project's Resource file and can deploy it to OpenShift.
   - **info** - Module that deals with input validation mostly.
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

Each Generator exposes the following public API:

### apply( targetDir, props )

When called this method allows the Generator to make changes to the user's project pointed at by `targetDir`.
This generally consists of copying and/or generating files. It can also update already pre-existing files (for
example add new dependencies a Maven POM file). The `props` is an object with properties required by the Generator.
These properties are passed on by the Capabilities.

### generate( resources, targetDir, props )

When called this method allows the Generator to make changes to the OpenShift/K8s Resources list that get passed in
as `resources`. These are the Resources that will be used in the end to create the application on OpenShift.
The `targetDir` and `props` are the same ones as passed to `apply`, but no changes should be made to the project
itself anymore!

### info( )

Returns the contents of the local `info.json` file as an object.

## Capabilities

Capabilities are modules that bundle one or more generators to add a set of features to a user's project that
together implement a useful and fleshed-out use-case. _Generators_ **do**, while _Capabilities_ **manage**.

For example, a "Database" _Capability_ might call on a _Generator_ that would create a mySQL database service,
while using another to create the _Secret_ that will store the database's connection information. Yet another
_Generator_ would create the Java code based on the Vert.x framework and copy that to the user's project. The
choice of database (mySQL, PostgreSQL, etc) and code language and framework (Node.js, Vert.x, Spring Boot, etc)
could be options that the user can pass to the _Capability_. In that aspect a _Capability_ can be as complex as
you want it to be.

Each Capability exposes the following public API:

### apply( capName, targetDir, props )

When called the Capability takes a list of all the Generators it will use, prepares the properties that it will
pass on to each of them and calls their `apply()` function one by one. The end result will be that the user's
project will have all the necessary files to work with and run the Capability.

### generate( capName, resources, targetDir, props )

When called the Capability takes a list of all the Generators it will use, prepares the properties that it will
pass on to each of them and calls their `generate()` function one by one. The end result will be a Resource list
with all the necessary builds, deployments, services, routes, config maps and secrets the user's project needs to
run on OpenShift.

### info( )

Returns the contents of the local `info.json` file as an object.

## Development

To make sure that any changes you make are properly propagated to all modules you might have to run the folowing
command:

```
$ yarn install --force
```

