<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

use function in_array;
use function rtrim;

class CorsMiddleware implements Middleware
{
    /**
     * 常に許可するローカル開発用オリジン。
     * 本番フロントのオリジンは環境変数 FRONTEND_URL（無ければ APP_URL）から取得する。
     */
    private const DEV_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];

    public function process(Request $request, RequestHandler $handler): Response
    {
        $response = $handler->handle($request);

        $response = $response
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            // 許可オリジンをリクエストごとに反射するため、キャッシュ汚染を防ぐ
            ->withHeader('Vary', 'Origin');

        $allowedOrigin = $this->resolveAllowedOrigin($request->getHeaderLine('Origin'));
        if ($allowedOrigin !== null) {
            $response = $response->withHeader('Access-Control-Allow-Origin', $allowedOrigin);
        }

        return $response;
    }

    /**
     * リクエストの Origin が許可リストに含まれる場合のみ、その値をそのまま返す。
     *
     * Access-Control-Allow-Credentials: true を返すためワイルドカード（*）は使用できず、
     * 許可済みオリジンを反射（echo back）する必要がある。許可リストに無い、または
     * Origin ヘッダが無い場合は null を返し、CORS ヘッダを付与しない。
     */
    private function resolveAllowedOrigin(string $requestOrigin): ?string
    {
        if ($requestOrigin === '') {
            return null;
        }

        $allowed = self::DEV_ORIGINS;

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '';
        if ($frontendUrl !== '') {
            // Origin ヘッダは末尾スラッシュを含まないため、比較用に正規化する
            $allowed[] = rtrim($frontendUrl, '/');
        }

        return in_array($requestOrigin, $allowed, true) ? $requestOrigin : null;
    }
}
