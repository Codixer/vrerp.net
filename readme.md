Website, and server for vrerp.net .

Setup instructions:

For local development:
* Create a local .env file with content:
```env
MONGO=mongodb://admin:admin@127.0.0.1:27019/vrerp?authSource=admin&directConnection=true
MODE=development
DYNO=local.dev
PORT=5080
accessKeyId=xxxx
secretAccessKey=xxxx
GIT_REV=dev
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxxx
DISCORD_BOT_TOKEN=xxxxx
SERVER_URL=http://localhost:5080/
SERVER_NAME=localhost
TELEGRAPH_TOKEN=xxxxxxx
MAIN_DISCORD_ID=xxxxxxx
MAIN_LOGS_CHANNEL=xxxxxxx
WORKERID=0
```

MAIN_DISCORD_ID  <- should be the ID of the discord server
MAIN_LOGS_CHANNEL <- should be the ID of the logs channel, visible for admins only -this will contain reports / etc

> npm run webpack
* create an empty package.json in dist-server  (because nodejs is finicky)

> npm run server

This should start a clean server.



For live deployment, starting with a clean ubuntu box:
> wget https://raw.githubusercontent.com/dokku/dokku/v0.27.5/bootstrap.sh
> sudo DOKKU_TAG=v0.27.5 bash bootstrap.sh

> sudo dokku plugin:install https://github.com/dokku/dokku-mongo.git mongo


> dokku apps:create vrerp
> dokku mongo:create mongo --image-version 3.6.18

> sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
> dokku config:set --no-restart vrerp DOKKU_LETSENCRYPT_EMAIL=your-email-here

> dokku config:set vrerp MODE=live

then dokku config:set the following environment variables:

MONGO:   linking to the mongo URL  (check dokku config:show vrerp)

Register a new bot on discord, add it to the discord server as admin, then fetch the oauth tokens for them, and set:

DISCORD_BOT_TOKEN:        xxx.xxxx.xxxxxx
DISCORD_CLIENT_ID:        123123123123
DISCORD_CLIENT_SECRET:    xxxxxxxxxxx


MAIN_DISCORD_ID:          xxxxxxx
MAIN_LOGS_CHANNEL:        xxxxxxxx
MODE:                     live
MONGO_URL:                mongodb://mongo:7b46c2ba9073599250a1274f38e44aa9@dokku-mongo-mongo:27017/mongo
SERVER_NAME:              vrerp.net
SERVER_URL:               https://vrerp.net/
TELEGRAPH_TOKEN:          xxxxxxx
WORKERID:                 1

AWS credentials:
accessKeyId:              xxx
secretAccessKey:          xxxxxxx

^^ to get telegraph token, go to https://telegra.ph/   publish an empty article, then go to https://edit.telegra.ph/   open dev console, and look for cookies (tph_uuid), use that as TELEGRAPH_TOKEN

To set up from clean slate:
* deploy the site
* make a new user for yourself
* when you reach the verification step, manually update the mongo server: select yourself in the users table, and add a new field:
    "roles" : [
        "verified",
        "onboarded",
        "admin",
    ],
* This will enable you to be on the site, and verify other users


* import the database files into mongo
* on /admin/guides  click "Update guides"
* remove all roles on the discord server
* run src\domains\discord\roles.js refresh     <- to load up, and connect roles

Good luck!
