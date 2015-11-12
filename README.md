Resource-registry project
============================

Resource-registry project is a web [Yii 2](http://www.yiiframework.com/) application for the 
decentralized property register of Natural Resources of Ukraine.

DIRECTORY STRUCTURE
-------------------

      assets/             contains assets definition
      commands/           contains console commands (controllers)
      config/             contains application configurations
      controllers/        contains Web controller classes
      mail/               contains view files for e-mails
      models/             contains model classes
      runtime/            contains files generated during runtime
      tests/              contains various tests for the basic application
      vendor/             contains dependent 3rd-party packages
      views/              contains view files for the Web application
      web/                contains the entry script and Web resources



REQUIREMENTS
------------

The minimum requirement by this project template that your Web server supports PHP 5.4.0.


INSTALLATION
------------

### Install from an Archive File

Extract the archive file downloaded from [github.com](https://github.com/litvinchuck/resource-registry/archive/master.zip) to
a root directory or any subdirectory located directly under the Web root.

Set cookie validation key in `config/web.php` file to some random secret string:

```php
'request' => [
    // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
    'cookieValidationKey' => '<secret random string goes here>',
],
```

You can then access the application through the following URL:

~~~
http://localhost/<subdirectory>
~~~


### Install via Git

If you do not have [git](https://git-scm.com) installed on your computer, you may install it by following the instructions
at [git-scm.com](https://git-scm.com/downloads).

Navigate to a root directory or any subdirectory located directly under the Web root.

You can then install this project using the following command:

~~~
git clone <repository url>
~~~

Now you should be able to access the application through the following URL:

~~~
http://localhost/<subdirectory>
~~~


DATABASE SETUP
--------------

A `resource_registry.sql` file is included in the repository. It should be used to create the base structure
of the database

### Using PhpMyAdmin

If you do not have [PhpMyAdmin](https://www.phpmyadmin.net/), you can install it by following the instructions
at [wiki.phpmyadmin.net](http://wiki.phpmyadmin.net/pma/Quick_Install).

* ##### Step 1
  Login into PhpMyAdmin.
* ##### Step 2
  Select the database in the left menu that you will be working with or create a new one.
* ##### Step 3
  Click Import in the top menu.
* ##### Step 4
  Under File to Import, click Browse and select the `resource_registry.sql` file.
* ##### Step 5
  Click OK at the bottom left

When the database has been imported successfully, you should see a message at the top of the page similar to:
> Import has been successfully finished, xx queries executed.

CONFIGURATION
-------------

### Database

Edit the file `config/db.php` with real data, for example:

```php
return [
    'class' => 'yii\db\Connection',
    'dsn' => 'mysql:host=localhost;dbname=resource-registry',
    'username' => 'root',
    'password' => '1234',
    'charset' => 'utf8',
];
```
