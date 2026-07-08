<?php

declare(strict_types=1);

use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Illuminate\Database\Capsule\Manager as Capsule;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);

            $loggerSettings = $settings->get('logger');
            $logger = new Logger($loggerSettings['name']);

            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler($loggerSettings['path'], $loggerSettings['level']);
            $logger->pushHandler($handler);

            return $logger;
        },

        // Database connection
        Capsule::class => function (ContainerInterface $c) {
            $capsule = new Capsule;
            $capsule->addConnection([
                'driver'    => 'mysql',
                'host'      => $_ENV['DB_HOST'],
                'database'  => $_ENV['DB_DATABASE'],
                'username'  => $_ENV['DB_USERNAME'],
                'password'  => $_ENV['DB_PASSWORD'],
                'charset'   => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix'    => '',
            ]);

            $capsule->setAsGlobal();
            $capsule->bootEloquent();

            return $capsule;
        },
    ]);
};
