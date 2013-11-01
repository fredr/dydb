#Installation#
- Install globally via npm: `npm install -g dydb`  
- Create the configuration file described under [Configuraton](#configuration)

#Usage#
`dydb command [options]`

##Commands##
`list`              list all tables in database  
`describe <table>`  get the schema for a table  
`count <table>`     get item count of table  
`create <file>`     create a table using a json definition file  
`delete <table>`    delete a table  
`dump <table>`      get all data from a table  
`truncate <table>`  remove all data from a table  

##Options##
`-h, --help`        output usage information  
`-V, --version`     output the version number  
`-e, --env <name>`  environment name as specified in the config  

#Configuration#
Add a file named `.dydb` to your home directory.  
Add `"default": true` to one of the entries, and that entry will be used when `--env` is omitted.

    {
        "local": {
            "default": true,
            "aws": {
                "sslEnabled": false,
                "endpoint": "localhost:8000",
                "accessKeyId": "xxx",
                "secretAccessKey": "xxx",
                "region": "xxx"
            }
        },
        "prod": {
            "aws": {
                "accessKeyId": "yyy",
                "secretAccessKey": "yyy",
                "region": "yyy"
            }
        }
    }

#Example#

```
dydb list -e dev
dydb dump Products -e prod > products.json
```
