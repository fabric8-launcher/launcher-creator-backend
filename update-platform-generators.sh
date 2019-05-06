#!/bin/bash

tmp=$(mktemp -d)
pushd $tmp
npx create-react-app my-react-app
cd my-react-app
rm -rf node_modules yarn.lock
cat >>README.md.tmp <<'EOT'
# platform-react

Created by the Cloud App Generator

Now that the application has been generated it can be deployed in the currently active project on OpenShift by running:

```
$ ./gap deploy
```

Now the only thing that is left to do is push the project's code to OpenShift to be run. To push the sources and
have the project be built on OpenShift you can do the following:

```
$ ./gap push
```

EOT
cat README.md >>README.md.tmp
mv README.md.tmp README.md
jq '.name = "{{.nodejs.name}}" | .version = "{{.nodejs.version}}"' package.json > package.json.tmp
mv package.json.tmp package.json
popd
cp -a $tmp/my-react-app/* catalog/generators/platform-react/files/
rm -rf $tmp

