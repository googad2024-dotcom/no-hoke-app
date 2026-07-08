<?php

declare(strict_types=1);

use App\Application\Actions\Contact\SendContactAction;
use App\Application\Actions\Diagnosis\StartDiagnosisAction;
use App\Application\Actions\Diagnosis\SubmitDiagnosisAction;
use App\Application\Actions\Lead\RegisterLeadAction;
use App\Application\Actions\Payment\CreatePaymentIntentAction;
use App\Application\Actions\Payment\PaymentStatusAction;
use App\Application\Actions\Payment\StripeWebhookAction;
use App\Application\Actions\Result\GetResultAction;
use App\Application\Actions\User\ListUsersAction;
use App\Application\Actions\User\ViewUserAction;
use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        // CORS Pre-Flight OPTIONS Request Handler
        return $response;
    });

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write('Hello world!');
        return $response;
    });

    // Health check endpoint
    $app->get('/health', function (Request $request, Response $response) {
        try {
            $capsule = $this->get(Capsule::class);
            $pdo = $capsule->getConnection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Exception $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        $data = [
            'status' => 'ok',
            'database' => $dbStatus,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->group('/users', function (Group $group) {
        $group->get('', ListUsersAction::class);
        $group->get('/{id}', ViewUserAction::class);
    });

    // API routes
    $app->group('/api', function (Group $group) {
        // ヘルスチェック（/api 配下からも疎通確認できるようにする）
        $group->get('/health', function (Request $request, Response $response) {
            try {
                $capsule = $this->get(Capsule::class);
                $capsule->getConnection()->getPdo();
                $dbStatus = 'connected';
            } catch (\Exception $e) {
                $dbStatus = 'error: ' . $e->getMessage();
            }

            $data = [
                'status' => 'ok',
                'database' => $dbStatus,
                'timestamp' => date('Y-m-d H:i:s'),
            ];

            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json');
        });

        // 診断API
        $group->post('/diagnosis/start', StartDiagnosisAction::class);
        $group->post('/diagnosis/submit', SubmitDiagnosisAction::class);

        // リード登録API
        $group->post('/lead/register', RegisterLeadAction::class);

        // お問い合わせAPI
        $group->post('/contact', SendContactAction::class);

        // 結果取得API
        $group->get('/result/{token}', GetResultAction::class);

        // 決済API（Stripe）
        $group->post('/payment/intent', CreatePaymentIntentAction::class);
        $group->get('/payment/status', PaymentStatusAction::class);

        // Stripe Webhook（署名検証で保護。フロントからは呼ばれない）
        $group->post('/stripe/webhook', StripeWebhookAction::class);
    });
};
