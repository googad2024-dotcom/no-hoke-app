<?php

declare(strict_types=1);

use App\Application\Settings\Settings;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Logger;

return function (ContainerBuilder $containerBuilder) {

    // Global Settings Object
    $containerBuilder->addDefinitions([
        SettingsInterface::class => function () {
            // 本番（APP_ENV=production）ではエラー詳細（スタックトレース・SQL等）を画面に出さない。
            // 未設定時は fail-closed で production 扱いとし、開発時は .env に APP_ENV=development 等を設定する。
            $isProduction = ($_ENV['APP_ENV'] ?? 'production') === 'production';

            return new Settings([
                'displayErrorDetails' => !$isProduction,
                // 詳細を画面に出さない代わりに、エラーは常にログへ記録する
                'logError'            => true,
                'logErrorDetails'     => true,
                'logger' => [
                    'name' => 'slim-app',
                    'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
                    'level' => Logger::DEBUG,
                ],
            ]);
        }
    ]);
};
